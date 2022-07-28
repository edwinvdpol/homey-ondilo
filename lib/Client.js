'use strict';

const {OAuth2Client} = require('homey-oauth2app');
const {filled} = require('./Utils');

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

    let error = null;

    if (filled(body.error)) {
      if (filled(body.error.message)) {
        error = body.error.message;
      } else {
        error = body.error;
      }
    }

    if (filled(body.error_description)) {
      error = body.error_description;
    }

    // Unauthorized
    if (status === 401) {
      return new Error(this.homey.__('errors.401'));
    }

    // Device / page not found
    if (status === 404) {
      return new Error(this.homey.__('errors.404'));
    }

    // API internal server error
    if (status >= 500 && status < 600) {
      return new Error(this.homey.__('errors.50x'));
    }

    // Custom error message
    if (error) {
      return new Error(error);
    }

    // Invalid response
    return new Error(this.homey.__('errors.response'));
  }

  // Handle result
  async onHandleResult({result, status, statusText, headers}) {
    if (filled(result) && typeof result === 'object') {
      return result;
    }

    this.error('Invalid API response:', result);

    throw new Error(this.homey.__('errors.response'));
  }

  // Request error
  async onRequestError({err}) {
    this.error('Request error:', err.message);

    throw new Error(this.homey.__('errors.50x'));
  }

  /*
  | Client actions
  */

  // Fetch device
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

}

module.exports = Client;
