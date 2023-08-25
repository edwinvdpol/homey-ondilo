'use strict';

const { OAuth2Device } = require('homey-oauth2app');
const { filled, blank } = require('./Utils');

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
        recommendations: await this.oAuth2Client.getRecommendations(id),
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
  async handleSyncData(data) {
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

    // Set recommendation data
    await this.handleRecommendationData(data.recommendations);

    this.setAvailable().catch(this.error);
  }

  // Handle recommendation data
  async handleRecommendationData(recommendations) {
    if (blank(recommendations)) {
      this.setStoreValue('recommendations', {}).catch(this.error);

      return;
    }

    let store = this.getStoreValue('recommendations');
    let active = Object.fromEntries(recommendations
      .filter((entry) => entry.status === 'waiting')
      .map((entry) => [entry.id, `${entry.title}: ${entry.message}`]));

    let storeString = JSON.stringify(store);
    let activeString = JSON.stringify(active);

    if (storeString !== activeString) {
      let device = this;

      for (const [id, recommendation] of Object.entries(active)) {
        if (store[id]) continue;

        // Recommendation trigger
        this.driver.recommendationTrigger
          .trigger(device, { recommendation })
          .then()
          .catch(device.error);
      }

      device = null;
    }

    // Update recommendations store
    this.setStoreValue('recommendations', active).catch(this.error);

    // Cleanup memory
    store = null;
    active = null;
    storeString = null;
    activeString = null;
  }

  /*
  | Timer functions
  */

  // Register timer
  async registerTimer() {
    if (this.syncDeviceTimer) return;

    this.syncDeviceTimer = this.homey.setInterval(this.sync.bind(this), (1000 * 60 * this.constructor.SYNC_INTERVAL));

    this.log('Timer registered');
  }

  // Unregister timer
  async unregisterTimer() {
    if (!this.syncDeviceTimer) return;

    this.homey.clearInterval(this.syncDeviceTimer);

    this.syncDeviceTimer = null;

    this.log('Timer unregistered');
  }

}

module.exports = Device;
