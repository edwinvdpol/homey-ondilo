'use strict';

const { OAuth2Client } = require('homey-oauth2app');
const { blank } = require('./Utils');

class Client extends OAuth2Client {

  static API_URL = 'https://interop.ondilo.com/api/customer/v1';
  static TOKEN_URL = 'https://interop.ondilo.com/oauth2/token';
  static AUTHORIZATION_URL = 'https://interop.ondilo.com/oauth2/authorize';
  static SCOPES = ['api'];

  /*
  | Device discovery functions
  */

  // Discover devices
  async discoverDevices() {
    const devices = await this._get('/pools');

    if (blank(devices)) {
      return [];
    }

    return devices;
  }

  /*
  | Device functions
  */

  // Return single device
  async getDevice(id) {
    return this._get(`/pools/${id}/device`);
  }

  // Return last measures for device
  async getLastMeasures(id) {
    return this._get(`/pools/${id}/lastmeasures`, { 'types[]': ['temperature', 'ph', 'orp', 'salt', 'tds', 'battery', 'rssi'] });
  }

  // Return recommendations for device
  async getRecommendations(id) {
    return this._get(`/pools/${id}/recommendations`);
  }

  /*
  | Support functions
  */

  // Perform GET request
  async _get(path, query = {}) {
    this.log('GET', path);

    return this.get({
      path,
      query,
      headers: {},
    });
  }

  /*
  | Client events
  */

  // Client initialized
  async onInit() {
    this.log('Initialized');
  }

  // Client destroyed
  async onUninit() {
    this.log('Destroyed');
  }

  // Request response is not OK
  async onHandleNotOK({
    body, status, statusText, headers,
  }) {
    this.error('Request not OK', JSON.stringify({
      body,
      status,
      statusText,
      headers,
    }));

    let error;

    if ('error' in body) {
      error = 'message' in body.error
        ? body.error.message
        : body.error;
    }

    if ('error_description' in body) {
      error = body.error_description;
    }

    // Client errors
    if (status === 401 || status === 403 || status === 404) {
      return new Error(this.homey.__(`error.${status}`));
    }

    // Internal server error
    if (status >= 500 && status < 600) {
      return new Error(this.homey.__('error.50x'));
    }

    // Custom error message
    if (error) {
      return new Error(error);
    }

    // Unknown error
    return new Error(this.homey.__('error.unknown'));
  }

  // Handle result
  async onHandleResult({
    result, status, statusText, headers,
  }) {
    if (typeof result === 'object') {
      this.log('[Response]', JSON.stringify(result));

      return result;
    }

    this.error('[Response]', result);

    throw new Error(this.homey.__('error.50x'));
  }

  // Request error
  async onRequestError({ err }) {
    this.error('[Request]', err.toString());

    throw new Error(this.homey.__('error.network'));
  }

}

module.exports = Client;
