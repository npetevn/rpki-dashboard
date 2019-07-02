'use strict';

let router = require('express').Router();
let publicRouter = require('express').Router({ mergeParams: true });
let _ = require('lodash');

const { Client } = require('pg')
const client = new Client()
client.connect();

global.rootApiPath = __dirname;

publicRouter.route('/test')
  .get((req, res) => {
    console.log('request got');
    res.send({ status: 'success' });
  });

publicRouter.route('/stats/:vp')
  .get(async (req, res) => {
    let asCount = await client.query('SELECT count(*) FROM asstats WHERE vantage_point = $1;', [req.params.vp]);
    let originAsCount = await client.query('SELECT count(*) FROM asstats WHERE (origin_valid + origin_unknown + origin_length_invalid + origin_as_invalid) > 0 AND vantage_point=$1;', [req.params.vp]);
    let transitAsCount = await client.query('SELECT count(*) FROM asstats WHERE (transit_valid + transit_unknown + transit_length_invalid + transit_as_invalid) > 0 AND vantage_point=$1;', [req.params.vp]);

    let originValidAsCount = await client.query('SELECT count(*) FROM asstats WHERE origin_valid > 0 AND vantage_point=$1;', [req.params.vp]);
    let originUnknownAsCount = await client.query('SELECT count(*) FROM asstats WHERE origin_unknown > 0 AND vantage_point=$1;', [req.params.vp]);
    let originAsInvalidAsCount = await client.query('SELECT count(*) FROM asstats WHERE origin_as_invalid > 0 AND vantage_point=$1;', [req.params.vp]);
    let originLengthInvalidAsCount = await client.query('SELECT count(*) FROM asstats WHERE origin_length_invalid > 0 AND vantage_point=$1;', [req.params.vp]);

    let transitValidAsCount = await client.query('SELECT count(*) FROM asstats WHERE transit_valid > 0 AND vantage_point=$1;', [req.params.vp]);
    let transitUnknownAsCount = await client.query('SELECT count(*) FROM asstats WHERE transit_unknown > 0 AND vantage_point=$1;', [req.params.vp]);
    let transitAsInvalidAsCount = await client.query('SELECT count(*) FROM asstats WHERE transit_as_invalid > 0 AND vantage_point=$1;', [req.params.vp]);
    let transitLengthInvalidAsCount = await client.query('SELECT count(*) FROM asstats WHERE transit_length_invalid > 0 AND vantage_point=$1;', [req.params.vp]);

    let prefixRes = await client.query('select sum(origin_valid) + sum(origin_unknown) + sum(origin_as_invalid) + sum(origin_length_invalid) as totalsum, sum(origin_valid) as valid, sum(origin_unknown) as unknown, sum(origin_as_invalid) as as_invalid, sum(origin_length_invalid) as length_invalid from asstats WHERE vantage_point=$1;', [req.params.vp]);
    let prefixStats = prefixRes.rows[0];

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

publicRouter.route('/as-resources/:vp')
  .get(async (req, res) => {
    let roasQuery = client.query('SELECT ta, asn, count(*) as count FROM roas GROUP BY ta, asn;');
    let neighborsQuery = client.query('SELECT * FROM asstats WHERE vantage_point=$1 AND min_distance <= $2;', [req.params.vp, 2]);

    let [roas, neighbors] = await Promise.all([roasQuery, neighborsQuery]);

    res.send({
      roas: roas.rows,
      neighbors: neighbors.rows
    });
  });

publicRouter.route('/roas')
  .get(async (req, res) => {
    let roas = await client.query('SELECT asn, prefix, maxLength, ta FROM roas;');

    res.send(roas.rows);
  });

router.use('/',
  publicRouter
);

module.exports = router;
