'use strict';

const {OAuth2Client} = require('homey-oauth2app');

class Client extends OAuth2Client {

  static API_URL = 'https://interop.ondilo.com/api/customer/v1';
  static TOKEN_URL = 'https://interop.ondilo.com/oauth2/token';
  static AUTHORIZATION_URL = 'https://interop.ondilo.com/oauth2/authorize';
  static SCOPES = ['api'];

  /*
  | Client events
  */

  // Request response is not OK
  async onHandleNotOK({body, status, statusText, headers}) {
    this.error('Request not OK', JSON.stringify({
      body: body,
      status: status,
      statusText: statusText,
      headers: headers
    }));

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

      throw new Error(this.homey.__('error.response'));
    }

    return result;
  }

  // Client initialized
  async onInit() {
    // Register event listeners
    this.registerEventListeners();

    this.log('Client initialized');
  }

  // Request error
  async onRequestError({err}) {
    this.error('Request error:', err.message);

    throw new Error(this.homey.__('error.50x'));
  }

  // Client destroyed
  async onUninit() {
    // Remove event listeners
    this.removeEventListeners();

    this.log('Client destroyed');
  }

  // Synchronize device
  async onSync(device) {
    const {id} = device.getData();

    try {
      const result = {
        pool: await this.getDevice(id),
        measures: await this.getLastMeasures(id)
      };

      this.homey.emit(`sync:${id}`, result);
    } catch (err) {
      this.homey.emit(`error:${id}`, err.message);
    }
  }

  /*
  | Client actions
  */

  async getDevice(id) {
    this.log(`Fetching device ${id}`);

    const result = await this.get({
      path: `/pools/${id}/device`,
      query: '',
      headers: {}
    });

    this.log(`Device ${id} response:`, JSON.stringify(result));

    return result;
  }

  // Fetch all devices
  async getDevices() {
    this.log('Fetching all devices');

    const result = await this.get({
      path: '/pools',
      query: '',
      headers: {}
    });

    this.log('Devices response:', JSON.stringify(result));

    return result;
  }

  // Fetch last measures for device
  async getLastMeasures(id) {
    this.log(`Fetching last measures for ${id}`);

    const result = await this.get({
      path: `/pools/${id}/lastmeasures`,
      query: {'types[]': ['temperature', 'ph', 'orp', 'salt', 'tds', 'battery', 'rssi']},
      headers: {}
    });

    this.log(`Measures for ${id} response:`, JSON.stringify(result));

    return result;
  }

  /*
  | Listener functions
  */

  // Register event listeners
  registerEventListeners() {
    this.onSyncDevice = this.onSync.bind(this);

    this.homey.on('sync', this.onSyncDevice);

    this.log('Event listeners registered');
  }

  // Remove event listeners
  removeEventListeners() {
    this.homey.off('sync', this.onSyncDevice);

    this.onSyncDevice = null;

    this.log('Event listeners removed');
  }

}

module.exports = Client;
