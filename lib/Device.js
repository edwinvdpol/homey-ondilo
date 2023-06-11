'use strict';

const { OAuth2Device } = require('homey-oauth2app');
const { filled } = require('./Utils');

class Device extends OAuth2Device {

  static SYNC_INTERVAL = 15; // Minutes

  /*
  | Device events
  */

  // Device deleted
  async onOAuth2Deleted() {
    this.unregisterTimer().catch(this.error);

    this.log('Deleted');
  }

  // Device initialized
  async onOAuth2Init() {
    // Synchronize device
    await this.sync();

    this.log('Initialized');

    // Register timer
    await this.registerTimer();
  }

  // Device destroyed
  async onOAuth2Uninit() {
    this.unregisterTimer().catch(this.error);

    this.log('Destroyed');
  }

  /*
  | Synchronization functions
  */

  // Synchronize
  async sync() {
    let result;

    try {
      this.log('[Sync] Get last measures from API');

      const { id } = this.getData();

      result = {
        pool: await this.oAuth2Client.getDevice(id),
        measures: await this.oAuth2Client.getLastMeasures(id),
      };

      await this.handleSyncData(result);
    } catch (err) {
      this.error(err.message);
      this.setUnavailable(err.message).catch(this.error);
    } finally {
      result = null;
    }
  }

  // Handle sync data
  handleSyncData(data) {
    this.log('[Sync]', JSON.stringify(data));

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

  // Register timer
  async registerTimer() {
    if (this.syncDeviceTimer) return;

    this.syncDeviceTimer = this.homey.setInterval(this.sync.bind(this), (1000 * 60 * this.constructor.SYNC_INTERVAL));
  }

  // Unregister timer
  async unregisterTimer() {
    if (!this.syncDeviceTimer) return;

    this.homey.clearInterval(this.syncDeviceTimer);

    this.syncDeviceTimer = null;
  }

}

module.exports = Device;
