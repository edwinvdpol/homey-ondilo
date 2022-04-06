'use strict';

const {OAuth2Client} = require('homey-oauth2app');

class Client extends OAuth2Client {

  static API_URL = 'https://interop.ondilo.com/api/customer/v1';
  static TOKEN_URL = 'https://interop.ondilo.com/oauth2/token';
  static AUTHORIZATION_URL = 'https://interop.ondilo.com/oauth2/authorize';
  static SCOPES = ['api'];

  /*
  |-----------------------------------------------------------------------------
  | Client events
  |-----------------------------------------------------------------------------
  */

  // Initialized
  async onInit() {
    this.log('Client initialized');
  }

  // Uninitialized
  async onUninit() {
    this.log('Client uninitialized');
  }

  // Request response is not OK
  async onHandleNotOK({body, status, statusText, headers}) {
    this.error('Request not OK', JSON.stringify({
      body: body,
      status: status,
      statusText: statusText,
      headers: headers
    }));

    this.homey.emit('ondilo:error', this.homey.__('errors.50x'));

    switch (status) {
      case 401:
        return new Error(this.homey.__('errors.401'));
      case 404:
        return new Error(this.homey.__('errors.404'));
      default:
        return new Error(this.homey.__('errors.50x'));
    }
  }

  // Handle result
  async onHandleResult({result, status, statusText, headers}) {
    if (typeof result !== 'object') {
      this.error('Invalid response result:', result);

      this.homey.emit('ondilo:error', this.homey.__('errors.response'));

      throw new Error(this.homey.__('error.response'));
    }

    return result;
  }

  // Request error
  async onRequestError({err}) {
    this.error('Request error:', err.message);

    this.homey.emit('ondilo:error', this.homey.__('errors.50x'));

    throw new Error(this.homey.__('error.50x'));
  }

  /*
  |-----------------------------------------------------------------------------
  | Client actions
  |-----------------------------------------------------------------------------
  */

  async getDevice(ondiloId) {
    this.log(`Fetching device ${ondiloId}`);

    const device = await this.get({
      path: `/pools/${ondiloId}/device`,
      query: '',
      headers: {}
    });

    this.log(`Device ${ondiloId} response:`, JSON.stringify(device));

    return device;
  }

  // Fetch all devices
  async getDevices() {
    this.log('Fetching all devices');

    const devices = await this.get({
      path: '/pools',
      query: '',
      headers: {}
    });

    this.log('Devices response:', JSON.stringify(devices));

    return devices;
  }

  // Fetch last measures for device
  async getLastMeasures(ondiloId) {
    this.log('Fetching last measures for device');

    const measures = await this.get({
      path: `/pools/${ondiloId}/lastmeasures`,
      query: {'types[]': ['temperature', 'ph', 'orp', 'salt', 'tds', 'battery', 'rssi']},
      headers: {}
    });

    this.log('Measures response:', JSON.stringify(measures));

    return measures;
  }

}

module.exports = Client;
