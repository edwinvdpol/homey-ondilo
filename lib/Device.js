'use strict';

const {OAuth2Device} = require('homey-oauth2app');

class Device extends OAuth2Device {

  /*
  |-----------------------------------------------------------------------------
  | Device events
  |-----------------------------------------------------------------------------
  */

  // Device deleted
  async onOAuth2Added() {
    this.log('Device added (oAuth2)');
  }

  // Device deleted
  async onOAuth2Deleted() {
    this.log('Device deleted (oAuth2)');

    this.cleanup();

    await this.homey.app.stopTimer();
  }

  // Device initialized
  async onOAuth2Init() {
    this.log('Device initialized (oAuth2)');

    this.ondiloId = this.getData().id;

    // Register listeners
    await this.registerEventListeners();

    // Start app timer
    await this.homey.app.startTimer();

    // Sync device data
    await this.syncDeviceData();
  }

  // Device saved
  async onOAuth2Saved() {
    this.log('Device saved (oAuth2)');
  }

  // Device uninitialized.
  async onOAuth2Uninit() {
    this.log('Device uninitialized (oAuth2)');

    this.cleanup();
  }

  /*
  |-----------------------------------------------------------------------------
  | Support functions
  |-----------------------------------------------------------------------------
  */

  // Cleanup device data / listeners
  cleanup() {
    this.log('Cleanup device data');

    // Remove event listeners for device
    this.homey.removeListener('ondilo:error', this.onError);
    this.homey.removeListener('ondilo:sync', this.onSync);
  }

  // Register event listeners
  async registerEventListeners() {
    this.onSync = this.syncDeviceData.bind(this);
    this.onError = this.setUnavailable.bind(this);

    this.homey.on('ondilo:error', this.onError);
    this.homey.on('ondilo:sync', this.onSync);
  }

  /*
  |-----------------------------------------------------------------------------
  | Device update commands
  |-----------------------------------------------------------------------------
  */

  // Synchronize device data
  async syncDeviceData() {
    try {
      await this.updateMeasures();
      await this.updateSettings();
      await this.setAvailable();
    } catch (err) {
      this.error('Update failed:', err);
      await this.setUnavailable(err.message);
    }
  }

  // Update measures
  async updateMeasures() {
    const data = await this.oAuth2Client.getLastMeasures(this.ondiloId);

    data.forEach(measure => {
      if (this.hasCapability(`measure_${measure.data_type}`)) {
        this.setCapabilityValue(`measure_${measure.data_type}`, measure.value).catch(this.error);
      }
    });
  }

  // Update settings
  async updateSettings() {
    const data = await this.oAuth2Client.getDevice(this.ondiloId);

    await this.setSettings({
      serial_number: data.serial_number || null,
      sw_version: data.sw_version || null
    });
  }
}

module.exports = Device;
