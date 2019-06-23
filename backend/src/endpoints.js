'use strict';

let router = require('express').Router();
let publicRouter = require('express').Router({ mergeParams: true });

global.rootApiPath = __dirname;

publicRouter.route('/test')
  .get((req, res) => {
    res.send({ status: 'success' });
  });

router.use('/',
  publicRouter
);

module.exports = router;
