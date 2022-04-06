'use strict';

const {Log} = require('homey-log');
const {OAuth2App} = require('homey-oauth2app');
const Client = require('./Client');

class Ondilo extends OAuth2App {

  static OAUTH2_CLIENT = Client;

  /*
  |-----------------------------------------------------------------------------
  | Application events
  |-----------------------------------------------------------------------------
  */

  // Application initialized
  async onOAuth2Init() {
    // Sentry logging
    this.homeyLog = new Log({homey: this.homey});

    // Reset state
    await this.resetState();

    // Register event listeners
    await this.registerEventListeners();
  }

  /*
  |-----------------------------------------------------------------------------
  | Application actions
  |-----------------------------------------------------------------------------
  */

  // Refresh devices
  async refreshDevices() {
    if (! await this.hasDevices()) {
      return;
    }

    this.homey.emit('ondilo:sync');
  }

  // Start refresh timer
  async startTimer() {
    if (!this.refreshTimer) {
      this.refreshTimer = this.homey.setInterval(this.refreshDevices.bind(this), this.refreshInterval);

      this.log('Timer started');
    }
  }

  // Stop refresh timer
  async stopTimer(force = false) {
    if (this.refreshTimer) {
      // Check devices
      if (await this.hasDevices() && !force) {
        return;
      }

      this.homey.clearTimeout(this.refreshTimer);

      // Reset state
      await this.resetState();

      this.log('Timer stopped');
    }
  }

  // Register event listeners
  async registerEventListeners() {
    this.homey.on('cpuwarn', () => {
      this.log('-- CPU warning! --');
    }).on('memwarn', () => {
      this.log('-- Memory warning! --');
    }).on('unload', () => {
      this.stopTimer(true).catch(this.error);

      this.log('-- Unloaded! --');
    });
  }

  /*
  |-----------------------------------------------------------------------------
  | Helpers
  |-----------------------------------------------------------------------------
  */

  // Returns whether app has devices
  async hasDevices() {
    try {
      const sessions = this.getSavedOAuth2Sessions();

      // Check if there are sessions available
      if (Object.keys(sessions).length === 0) {
        return false;
      }

      const sessionId = Object.keys(sessions)[0];
      const configId = sessions[sessionId]['configId'];
      const devices = await this.getOAuth2Devices({sessionId, configId})

      return Object.keys(devices).length > 0;
    } catch (err) {
      return false;
    }
  }

  // Reset state
  async resetState() {
    this.log('Reset state');

    this.refreshInterval = 15 * 60 * 1000; // 15 minutes
    this.refreshTimer = null;
  }

}

module.exports = Ondilo;
