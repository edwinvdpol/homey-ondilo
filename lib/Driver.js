'use strict';

const {OAuth2Driver} = require('homey-oauth2app');

class Driver extends OAuth2Driver {

  // Driver initialized
  async onOAuth2Init() {
    this.log('Driver initialized (oAuth2)');
  }

  // Pair devices
  async onPairListDevices({oAuth2Client}) {
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

module.exports = Driver;
