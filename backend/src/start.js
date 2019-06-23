'use strict';

global.rootApiPath = __dirname;

let app         = require('./app');

app.listen(4000, '0.0.0.0');
