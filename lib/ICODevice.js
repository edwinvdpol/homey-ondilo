'use strict';

const Homey = require('homey');
const { OAuth2Device } = require('homey-oauth2app');

module.exports = class ICODevice extends OAuth2Device {

  /*
  |-----------------------------------------------------------------------------
  | Initialize device
  |-----------------------------------------------------------------------------
  */

  async onOAuth2Init() {
    this.log('Device has been initialized');

    // Update device
    await this._updateSettings();
    await this._updateMeasures();

    // Event listener
    this.homey.on('refresh_devices', this._updateMeasures.bind(this));
  }

  /*
  |-----------------------------------------------------------------------------
  | Update measures for device
  |-----------------------------------------------------------------------------
  */

  async _updateMeasures() {
    try {
      this.log('Updating measures');

      let data = await this.oAuth2Client.getLastMeasures(this.getData().id);

      data.forEach(measure => {
        if (this.hasCapability(`measure_${measure.data_type}`)) {
          this.setCapabilityValue(`measure_${measure.data_type}`, measure.value);
        }
      });

      if (! this.getAvailable()) {
        await this.setAvailable();
      }
    } catch (error) {
      this.error(error.message);
      this.setUnavailable(error.message).catch(this.error);
    }
  }

  /*
  |-----------------------------------------------------------------------------
  | Update settings for device
  |-----------------------------------------------------------------------------
  */

  async _updateSettings() {
    try {
      this.log('Updating settings');

      let data = await this.oAuth2Client.getDevice(this.getData().id);

      await this.setSettings({
        serial_number: data.serial_number || null,
        sw_version: data.sw_version || null
      });

      if (! this.getAvailable()) {
        await this.setAvailable();
      }
    } catch (error) {
      this.error(error.message);
      this.setUnavailable(error.message).catch(this.error);
    }
  }
}
