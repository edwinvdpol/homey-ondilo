'use strict';

class Timer {

  // Constructor
  constructor({homey, id}) {
    this.homey = homey;
    this.timer = null;
    this.id = id;
  }

  // Fire sync event
  sync() {
    this.homey.emit('sync', this.id);
  }

  // Start timer
  async start(seconds = null) {
    if (this.timer) {
      return;
    }

    if (!seconds) {
      seconds = 900; // 15 minutes
    }

    this.timer = this.homey.setInterval(this.sync.bind(this), (1000 * seconds));

    this.log(`Started with ${seconds} seconds`);
  }

  // Stop timer
  async stop() {
    if (!this.timer) {
      return;
    }

    this.homey.clearTimeout(this.timer);
    this.timer = null;

    this.log('Stopped');
  }

  /*
  | Log functions
  */

  log() {
    this.homey.log(`[Device] [${this.id}] [Timer]`, ...arguments);
  }
}

module.exports = Timer;
