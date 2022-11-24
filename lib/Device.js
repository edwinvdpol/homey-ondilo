'use strict';

const { OAuth2Device } = require('homey-oauth2app');
const { filled } = require('./Utils');

class Device extends OAuth2Device {

  /*
  | Device events
  */

  // Device deleted
  async onOAuth2Deleted() {
    // Stop timer
    this.stopTimer().catch(this.error);

    this.log('Deleted');
  }

  // Device initialized
  async onOAuth2Init() {
    // Start timer
    await this.startTimer();

    this.log('Initialized');

    // Synchronize device
    await this.sync();
  }

  // Device destroyed
  async onOAuth2Uninit() {
    // Stop timer
    this.stopTimer().catch(this.error);

    this.log('Destroyed');
  }

  /*
  | Synchronization functions
  */

  async sync() {
    try {
      const { id } = this.getData();

      const result = {
        pool: await this.oAuth2Client.getDevice(id),
        measures: await this.oAuth2Client.getLastMeasures(id),
      };

      await this.handleSyncData(result);
    } catch (err) {
      this.error(err.message);
      this.setUnavailable(err.message).catch(this.error);
    }
  }

  // Set device data
  handleSyncData(data) {
    this.log('Update device', JSON.stringify(data));

    // Set settings with pool data
    if (filled(data.pool)) {
      this.setSettings({
        serial_number: data.pool.serial_number || null,
        sw_version: data.pool.sw_version || null,
      }).catch(this.error);
    }

    // Set measures data
    if (filled(data.measures)) {
      data.measures.forEach((measure) => {
        if (this.hasCapability(`measure_${measure.data_type}`)) {
          this.setCapabilityValue(`measure_${measure.data_type}`, measure.value).catch(this.error);
        }
      });
    }

    this.setAvailable().catch(this.error);
  }

  /*
  | Timer functions
  */

  // Start timer
  async startTimer(minutes = null) {
    if (this.timer) return;

    if (!minutes) {
      minutes = 15;
    }

    this.timer = this.homey.setInterval(this.sync.bind(this), (1000 * 60 * minutes));

    this.log(`Timer started with ${minutes} minutes`);
  }

  // Stop timer
  async stopTimer() {
    if (!this.timer) return;

    this.homey.clearTimeout(this.timer);
    this.timer = null;

    this.log('Timer stopped');
  }

}

module.exports = Device;
