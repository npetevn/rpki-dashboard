'use strict';

const forever           = require('forever-monitor');
const _                 = require('lodash');

class Impl {
  static dev(port, name) {
    let env = process.env.NODE_ENV === undefined ? 'development' : process.env.NODE_ENV;
    // TODO the NODE_OPTS are set by the dev env - this is here only for backwards
    // compatibility and for the frontends
    let nodeOpts = process.env.NODE_OPTS === undefined ? '' : process.env.NODE_OPTS;
    let scriptLine = _.filter(['node'].concat(nodeOpts.split(' ')).concat('start.js'), (o) => o && o !== '');
    forever.start(scriptLine, {
      cwd: __dirname,
      watch: env === 'development' ? true : false,
      watchDirectory: __dirname,
      max: undefined,
      killTree: true,
     'minUptime': 1000,
     'spinSleepTime': 1000,
      env: {
        'NODE_ENV': env,
        'APP_PORT': port,
        'APP_NAME': 'rpki-api'
      }
    });
  };
}

Impl.dev(process.env.APP_PORT || 4000);
