'use strict';

const { OAuth2Driver } = require('homey-oauth2app');

module.exports = class ICODriver extends OAuth2Driver {

  /*
  |-----------------------------------------------------------------------------
  | Pair devices
  |-----------------------------------------------------------------------------
  */

  async onPairListDevices({ oAuth2Client }) {
    this.log('Listing devices');

    const devices = await oAuth2Client.getDevices();

    return devices.map(device => {
      return {
        name: device.name,
        data: {
          id: device.id,
        },
        settings: {
          volume: String(device.volume) + ' m³',
        }
      }
    });
  }
}
