'use strict';

const { OAuth2Client, OAuth2Error } = require('homey-oauth2app');

module.exports = class ICOAuth2Client extends OAuth2Client {

  static API_URL = 'https://interop.ondilo.com/api/customer/v1';
  static TOKEN_URL = 'https://interop.ondilo.com/oauth2/token';
  static AUTHORIZATION_URL = 'https://interop.ondilo.com/oauth2/authorize';
  static SCOPES = ['api'];

  /*
  |-----------------------------------------------------------------------------
  | The request is not OK
  |-----------------------------------------------------------------------------
  */

  async onHandleNotOK({ body, status }) {
    this.log('Request is not OK: ', JSON.stringify(body));

    let error;

    switch(status) {
      case 401:
        error = this.homey.__('errors.401');
        break;
      case 404:
        error = this.homey.__('errors.404');
        break;
      default:
        error = this.homey.__('errors.50x');
    }

    throw new OAuth2Error(error);
  }

  /*
  |-----------------------------------------------------------------------------
  | Request has an error
  |-----------------------------------------------------------------------------
  */

  async onRequestError({ err }) {
    this.log('Request error:', err);

    throw new OAuth2Error(this.homey.__('errors.50x'));
  }

  /*
  |-----------------------------------------------------------------------------
  | Get device information
  |-----------------------------------------------------------------------------
  */

  async getDevice(id) {
    return this.get({ path: `/pools/${id}/device` });
  }

  /*
  |-----------------------------------------------------------------------------
  | List all devices
  |-----------------------------------------------------------------------------
  */

  async getDevices() {
    return this.get({ path: '/pools' });
  }

  /*
  |-----------------------------------------------------------------------------
  | Get last measures for device
  |-----------------------------------------------------------------------------
  */

  async getLastMeasures(id) {
    return this.get({
      path: `/pools/${id}/lastmeasures`,
      query: {'types[]': ['temperature', 'ph', 'orp', 'salt', 'tds', 'battery', 'rssi']},
    });
  }
}
