'use strict';

global.rootApiPath = __dirname;

let app         = require('./app');

app.listen(4000, 'localhost');
