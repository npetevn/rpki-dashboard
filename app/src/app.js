'use strict';

let express       = require('express'),
    app           = express(),
    endpoints     = require('./endpoints'),
    bodyParser    = require('body-parser'),
    cookieParser  = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(`/api`, endpoints);
app.use('/', express.static(__dirname + '/ui'));

// Override default unhandledRejection to not kill the process
// This should not be called in node 8 version.
process.on('unhandledRejection', (reason) => {
  console.log('----------------------------------------Unhandled rejection---------------------------------------');
  if (reason.stack) {
    console.log(reason);
    console.log(reason.stack);
  } else {
    console.log(reason);
  }
});

module.exports = app;
