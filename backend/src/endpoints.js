'use strict';

let router = require('express').Router();
let publicRouter = require('express').Router({ mergeParams: true });
const { Client } = require('pg')
const client = new Client()

global.rootApiPath = __dirname;

publicRouter.route('/test')
  .get((req, res) => {
    console.log('request got');
    res.send({ status: 'success' });
  });

publicRouter.route('/stats')
  .get(async (req, res) => {
    await client.connect();
    let asCount = await client.query('SELECT count(*) FROM asstats;');
    let originAsCount = await client.query('SELECT count(*) FROM asstats WHERE (origin_valid + origin_unknown + origin_length_invalid + origin_as_invalid) > 0;');
    let transitAsCount = await client.query('SELECT count(*) FROM asstats WHERE (transit_valid + transit_unknown + transit_length_invalid + transit_as_invalid) > 0;');

    let originValidAsCount = await client.query('SELECT count(*) FROM asstats where origin_valid > 0;');
    let originUnknownAsCount = await client.query('SELECT count(*) FROM asstats where origin_unknown > 0;');
    let originAsInvalidAsCount = await client.query('SELECT count(*) FROM asstats where origin_as_invalid > 0;');
    let originLengthInvalidAsCount = await client.query('SELECT count(*) FROM asstats where origin_length_invalid > 0;');

    let transitValidAsCount = await client.query('SELECT count(*) FROM asstats where transit_valid > 0;');
    let transitUnknownAsCount = await client.query('SELECT count(*) FROM asstats where transit_unknown > 0;');
    let transitAsInvalidAsCount = await client.query('SELECT count(*) FROM asstats where transit_as_invalid > 0;');
    let transitLengthInvalidAsCount = await client.query('SELECT count(*) FROM asstats where transit_length_invalid > 0;');

    let prefixRes = await client.query('select sum(origin_valid) + sum(origin_unknown) + sum(origin_as_invalid) + sum(origin_length_invalid) as totalsum, sum(origin_valid) as valid, sum(origin_unknown) as unknown, sum(origin_as_invalid) as as_invalid, sum(origin_length_invalid) as length_invalid from asstats;');
    let prefixStats = prefixRes.rows[0];

    await client.end();

    res.send({
      totalAsCount: asCount.rows[0]['count'],
      originAsCount: originAsCount.rows[0]['count'],
      transitAsCount: transitAsCount.rows[0]['count'],
      originValidAsCount: originValidAsCount.rows[0]['count'],
      originUnknownAsCount: originUnknownAsCount.rows[0]['count'],
      originAsInvalidAsCount: originAsInvalidAsCount.rows[0]['count'],
      originLengthInvalidAsCount: originLengthInvalidAsCount.rows[0]['count'],
      transitValidAsCount: transitValidAsCount.rows[0]['count'],
      transitUnknownAsCount: transitUnknownAsCount.rows[0]['count'],
      transitAsInvalidAsCount: transitAsInvalidAsCount.rows[0]['count'],
      transitLengthInvalidAsCount: transitLengthInvalidAsCount.rows[0]['count'],
      totalPrefixCount: prefixStats['totalsum'],
      validPrefixCount: prefixStats['valid'],
      unknownPrefixCount: prefixStats['unknown'],
      asInvalidPrefixCount: prefixStats['as_invalid'],
      lengthInvalidPrefixCount: prefixStats['length_invalid']
    });
  });

router.use('/',
  publicRouter
);

module.exports = router;
