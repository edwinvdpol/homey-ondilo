'use strict';

const {OAuth2Device} = require('homey-oauth2app');

class Device extends OAuth2Device {

  /*
  | Device events
  */

  // Device added
  async onOAuth2Added() {
    this.log('Device added');
  }

  // Device deleted
  async onOAuth2Deleted() {
    // Clean device data
    this.clean();

    this.log('Device deleted');
  }

  // Device initialized
  async onOAuth2Init() {
    // Wait for driver to become ready
    await this.driver.ready();

    // Register event listeners
    this.registerEventListeners();

    // Start timer
    this.startTimer().catch(this.error);

    this.log('Device initialized');

    // Sync device data
    this.sync();
  }

  // Device destroyed
  async onOAuth2Uninit() {
    // Clean device data
    this.clean();

    this.log('Device destroyed');
  }

  /*
  | Synchronization functions
  */

  // Synchronize device
  sync() {
    const device = this;

    this.homey.emit('sync', device);
  }

  // Set device data
  handleSyncData(data) {
    // Set settings with pool data
    this.handlePoolData(data.pool);

    // Set measures data
    this.handleMeasuresData(data.measures);

    this.setAvailable().catch(this.error);
  }

  // Set measures data
  handleMeasuresData(data) {
    data.forEach(measure => {
      if (this.hasCapability(`measure_${measure.data_type}`)) {
        this.setCapabilityValue(`measure_${measure.data_type}`, measure.value).catch(this.error);
      }
    });
  }

  // Set pool data
  handlePoolData(data) {
    const settings = {
      serial_number: data.serial_number || null,
      sw_version: data.sw_version || null
    }

    this.setSettings(settings).catch(this.error);
  }

  /*
  | Listener functions
  */

  // Register event listeners
  registerEventListeners() {
    const {id} = this.getData();

    this.onSync = this.handleSyncData.bind(this);
    this.onError = this.setUnavailable.bind(this);

    this.homey.on(`error:${id}`, this.onError);
    this.homey.on(`sync:${id}`, this.onSync);

    this.log('Event listeners registered');
  }

  // Remove event listeners
  removeEventListeners() {
    const {id} = this.getData();

    this.homey.off(`error:${id}`, this.onError);
    this.homey.off(`sync:${id}`, this.onSync);

    this.onError = null;
    this.onSync = null;

    this.log('Event listeners removed');
  }

  /*
  | Timer functions
  */

  // Start timer
  async startTimer(seconds = null) {
    if (this._timer) {
      return;
    }

    if (!seconds) {
      seconds = 900; // 15 minutes
    }

    this._timer = this.homey.setInterval(this.sync.bind(this), (1000 * seconds));

    this.log(`Timer started with ${seconds} seconds`);
  }

  // Stop timer
  async stopTimer() {
    if (!this._timer) {
      return;
    }

    this.homey.clearTimeout(this._timer);
    this._timer = null;

    this.log('Timer stopped');
  }

  /*
  | Support functions
  */

  // Clean device data
  clean() {
    // Stop timer
    this.stopTimer().catch(this.error);

    // Remove event listeners
    this.removeEventListeners();

    this.log('Device data cleaned');
  }
}

module.exports = Device;
