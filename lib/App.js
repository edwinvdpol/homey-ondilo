'use strict';

const {Log} = require('homey-log');
const {OAuth2App} = require('homey-oauth2app');
const Client = require('./Client');

class App extends OAuth2App {

  static OAUTH2_DRIVERS = ['pool', 'spa'];
  static OAUTH2_CLIENT = Client;

  // Application initialized
  async onOAuth2Init() {
    // Register event listeners
    this.homey.on('unload', this.onUnload.bind(this));

    // Sentry logging
    this.homeyLog = new Log({homey: this.homey});

    this.log('Initialized');
  }

  // Application destroyed
  async onUninit() {
    this.log('Destroyed');
  }

  // Application unload
  async onUnload() {
    this.log('Unloaded');
  }

}

module.exports = App;
