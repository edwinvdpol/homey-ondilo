'use strict';

const Homey = require('homey');
const ICOAuth2Client = require('/lib/ICOAuth2Client');
const { OAuth2App } = require('homey-oauth2app');

module.exports = class App extends OAuth2App {

  static OAUTH2_CLIENT = ICOAuth2Client;
  static OAUTH2_DEBUG = false;

  /*
  |-----------------------------------------------------------------------------
  | Initialize application
  |-----------------------------------------------------------------------------
  */

  async onOAuth2Init() {
    this.log('App has been initialized');

    await super.onOAuth2Init();

    this.log('Starting update timer interval');
    this.updateInterval = this.homey.setInterval(this._refreshDevices.bind(this), 15 * 60 * 1000);

    this.homey.on('cpuwarn', () => {
      this.log('-- CPU warning! --');
    }).on('memwarn', () => {
      this.log('-- Memory warning! --');
    }).on('unload', () => {
      this.log('Stopping update timer interval');
      this.homey.clearInterval(this.updateInterval);

      this.log('-- Unloaded! --');
    });
  }

  /*
  |-----------------------------------------------------------------------------
  | Refresh devices
  |-----------------------------------------------------------------------------
  */

  async _refreshDevices() {
    if (Object.keys(this.getSavedOAuth2Sessions()).length === 0) {
      return;
    }

    // Emit the refresh devices event
    this.homey.emit('refresh_devices');
  }
}
