'use strict';

const {OAuth2Device} = require('homey-oauth2app');

class Device extends OAuth2Device {

  /*
  |-----------------------------------------------------------------------------
  | Device events
  |-----------------------------------------------------------------------------
  */

  // Device added
  async onOAuth2Added() {
    this.log('Device added (oAuth2)');
  }

  // Device deleted
  async onOAuth2Deleted() {
    this.log('Device deleted (oAuth2)');
  }

  // OAuth2 session is revoked
  async onOAuth2Destroyed() {
    this.error('Login session destroyed (oAuth2)');

    this.setUnavailable(this.homey.__('error.revoked')).catch(this.error);

    await this.cleanup();
  }

  // OAuth2 session is expired
  async onOAuth2Expired() {
    this.error('Login session expired (oAuth2)');

    this.setUnavailable(this.homey.__('error.expired')).catch(this.error);

    await this.cleanup();
  }

  // Device initialized
  async onOAuth2Init() {
    this.log('Device initialized (oAuth2)');

    this.setUnavailable().catch(this.error);

    this.ondiloId = this.getData().id;

    // Wait for driver to become ready
    await this.driver.ready();

    // Register listeners
    await this.registerEventListeners();

    // Start refresh timer
    await this.homey.app.startTimer();

    // Sync device data
    this.syncDeviceData();
  }

  // Device saved
  async onOAuth2Saved() {
    this.log('Device saved (oAuth2)');
  }

  // Device uninitialized
  async onOAuth2Uninit() {
    this.log('Device uninitialized (oAuth2)');

    await this.cleanup();

    await this.homey.app.stopTimer();
  }

  /*
  |-----------------------------------------------------------------------------
  | Support functions
  |-----------------------------------------------------------------------------
  */

  // Cleanup device data / listeners
  async cleanup() {
    this.log('Cleanup device data');

    // Remove event listeners for device
    this.homey.off('ondilo:error', this.onError);
    this.homey.off('ondilo:sync', this.onSync);
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
  syncDeviceData() {
    Promise.resolve().then(async () => {
      await this.updateMeasures();
      await this.updateSettings();
      await this.setAvailable();
    }).catch(err => {
      this.error('Update failed:', err);
      this.setUnavailable(err.message).catch(this.error);
    });
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
