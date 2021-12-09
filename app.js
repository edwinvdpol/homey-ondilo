'use strict';

const {Log} = require('homey-log');
const {OAuth2App} = require('homey-oauth2app');
const Client = require('./lib/Client');

class Ondilo extends OAuth2App {

  static OAUTH2_CLIENT = Client;
  //static OAUTH2_DEBUG = true;

  /*
  |-----------------------------------------------------------------------------
  | Application events
  |-----------------------------------------------------------------------------
  */

  async onOAuth2Init() {
    // Sentry logging
    this.homeyLog = new Log({homey: this.homey});

    // Reset properties
    this.refreshInterval = 15 * 60 * 1000; // 15 minutes
    this.refreshTimer = null;

    this.homey.on('cpuwarn', () => {
      this.log('-- CPU warning! --');
    }).on('memwarn', () => {
      this.log('-- Memory warning! --');
    }).on('unload', () => {
      this.stopTimer(true);

      this.log('-- Unloaded! --');
    });
  }

  /*
  |-----------------------------------------------------------------------------
  | Application actions
  |-----------------------------------------------------------------------------
  */

  // Start refresh timer
  startTimer() {
    if (!this.refreshTimer) {
      this.refreshTimer = this.homey.setInterval(this.refreshDevices.bind(this), this.refreshInterval);
    }

    this.log('Timer started');
  }

  // Stop refresh timer
  stopTimer(force = false) {
    // Check number of devices
    if (this.hasOAuthDevices() && !force) {
      return;
    }

    this.homey.clearTimeout(this.refreshTimer);

    this.log('Timer stopped');
  }

  // Synchronize devices
  async refreshDevices() {
    this.homey.emit('ondilo:sync');
  }

  /*
  |-----------------------------------------------------------------------------
  | Helpers
  |-----------------------------------------------------------------------------
  */

  // Returns whether devices are available
  hasOAuthDevices() {
    const sessions = this.getSavedOAuth2Sessions();

    // Check if there are sessions available
    if (Object.keys(sessions).length === 0) {
      this.log('No oAuth sessions found');

      return false;
    }

    // Get oAuth session
    const sessionId = Object.keys(sessions)[0];
    const configId = sessions[sessionId]['default'];

    const devices = this.getOAuth2Devices({sessionId, configId});

    return Object.keys(devices).length === 0;
  }
}

module.exports = Ondilo;
