'use strict';

const Homey = require('homey');
const ICOAuth2Client = require('/lib/ICOAuth2Client');
const { OAuth2App } = require('homey-oauth2app');

module.exports = class App extends OAuth2App {

  /*
  |-----------------------------------------------------------------------------
  | Initialize application
  |-----------------------------------------------------------------------------
  */

  async onOAuth2Init() {
    this.log('App has been initialized');

    this.enableOAuth2Debug();
    this.setOAuth2Config({
      client: ICOAuth2Client,
      apiUrl: 'https://interop.ondilo.com/api/customer/v1',
      tokenUrl: 'https://interop.ondilo.com/oauth2/token',
      authorizationUrl: 'https://interop.ondilo.com/oauth2/authorize',
      scopes: ['api'],
    });

    this.log('Starting update timer interval');
    this.updateInterval = setInterval(this._refreshDevices.bind(this), 15 * 60 * 1000);

    Homey.on('cpuwarn', () => {
      this.log('-- CPU warning! --');
    }).on('memwarn', () => {
      this.log('-- Memory warning! --');
    }).on('unload', () => {
      this.log('Stopping update timer interval');
      clearInterval(this.updateInterval);

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
    Homey.emit('refresh_devices');
  }
}
