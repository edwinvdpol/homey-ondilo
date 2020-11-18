'use strict';

const Homey = require('homey');
const { OAuth2Client, OAuth2Error } = require('homey-oauth2app');

module.exports = class ICOAuth2Client extends OAuth2Client {

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
        error = Homey.__('errors.401');
        break;
      case 404:
        error = Homey.__('errors.404');
        break;
      case 501:
      case 503:
        error = Homey.__('errors.50x');
        break;
      default:
        error = Homey.__('errors.unknown');
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

    throw new OAuth2Error(Homey.__('errors.unknown'));
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
