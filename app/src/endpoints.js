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

publicRouter.route('/stats/:vp/:family')
  .get(async (req, res) => {
    let family = req.params.family === 'v4' ? 'v4' : 'v6';
    let asCount = await client.query('SELECT count(*) FROM asstats WHERE vantage_point = $1;', [req.params.vp]);
    let originAsCount = await client.query(`SELECT count(*) FROM asstats WHERE (origin_valid_${family} + origin_unknown_${family} + origin_length_invalid_${family} + origin_as_invalid_${family}) > 0 AND vantage_point=$1;`, [req.params.vp]);
    let transitAsCount = await client.query(`SELECT count(*) FROM asstats WHERE (transit_valid_${family} + transit_unknown_${family} + transit_length_invalid_${family} + transit_as_invalid_${family}) > 0 AND vantage_point=$1;`, [req.params.vp]);

    let originAsOnlyUnknownCount = await client.query(`
      SELECT count(*) FROM asstats
      WHERE (origin_unknown_${family} > 0) AND
            (origin_valid_${family} = 0 AND origin_as_invalid_${family} = 0 AND origin_length_invalid_${family} = 0)  AND
            vantage_point=$1;`,
      [req.params.vp]);

    let originAsOnlyValidCount = await client.query(`
      SELECT count(*) FROM asstats
      WHERE (origin_valid_${family} > 0) AND
            (origin_unknown_${family} = 0 AND origin_as_invalid_${family} = 0 AND origin_length_invalid_${family} = 0) AND
            vantage_point=$1;`,
      [req.params.vp]);

    let originAsOnlyValidAndUnknownCount = await client.query(`
      SELECT count(*) FROM asstats
      WHERE (origin_valid_${family} > 0 AND origin_unknown_${family} > 0) AND
            (origin_as_invalid_${family} = 0 AND origin_length_invalid_${family} = 0) AND
            vantage_point=$1;`,
      [req.params.vp]);

    let originAsMixedStatusCount = await client.query(`
      SELECT count(*) FROM asstats
      WHERE (origin_valid_${family} > 0 OR origin_unknown_${family} > 0) AND
            (origin_as_invalid_${family} > 0 OR origin_length_invalid_${family} > 0) AND
            vantage_point=$1;`,
      [req.params.vp]);

    let originAsOnlyInvalidCount = await client.query(`
      SELECT count(*) FROM asstats
      WHERE (origin_valid_${family} = 0 AND origin_unknown_${family} = 0) AND
            (origin_as_invalid_${family} > 0 OR origin_length_invalid_${family} > 0) AND
            vantage_point=$1;`,
      [req.params.vp]);

    let transitAsOnlyValidAndUnknownCount = await client.query(`
      SELECT count(*) FROM asstats
      WHERE (transit_valid_${family} + transit_unknown_${family} > 0) AND
            (transit_as_invalid_${family} = 0 AND transit_length_invalid_${family} = 0) AND
            vantage_point=$1;`,
      [req.params.vp]);

    let transitAsInvalidCount = await client.query(`
      SELECT count(*) FROM asstats
      WHERE (transit_as_invalid_${family} > 0 AND transit_length_invalid_${family} = 0) AND
            vantage_point=$1;`,
      [req.params.vp]);

    let transitAsLengthInvalidCount = await client.query(`
      SELECT count(*) FROM asstats
      WHERE (transit_as_invalid_${family} = 0 AND transit_length_invalid_${family} > 0) AND
            vantage_point=$1;`,
      [req.params.vp]);

    let transitAsMixInvalidCount = await client.query(`
      SELECT count(*) FROM asstats
      WHERE (transit_as_invalid_${family} > 0 AND transit_length_invalid_${family} > 0) AND
            vantage_point=$1;`,
      [req.params.vp]);

    let originValidAsCount = await client.query(`SELECT count(*) FROM asstats WHERE origin_valid_${family} > 0 AND vantage_point=$1;`, [req.params.vp]);
//    let originUnknownAsCount = await client.query(`SELECT count(*) FROM asstats WHERE origin_unknown_${family} > 0 AND vantage_point=$1;`, [req.params.vp]);
    let originAsInvalidAsCount = await client.query(`SELECT count(*) FROM asstats WHERE origin_as_invalid_${family} > 0 AND vantage_point=$1;`, [req.params.vp]);
    let originLengthInvalidAsCount = await client.query(`SELECT count(*) FROM asstats WHERE origin_length_invalid_${family} > 0 AND vantage_point=$1;`, [req.params.vp]);
//
    let transitValidAsCount = await client.query(`SELECT count(*) FROM asstats WHERE transit_valid_${family} > 0 AND vantage_point=$1;`, [req.params.vp]);
    let transitUnknownAsCount = await client.query(`SELECT count(*) FROM asstats WHERE transit_unknown_${family} > 0 AND vantage_point=$1;`, [req.params.vp]);
    let transitAsInvalidAsCount = await client.query(`SELECT count(*) FROM asstats WHERE transit_as_invalid_${family} > 0 AND vantage_point=$1;`, [req.params.vp]);
    let transitLengthInvalidAsCount = await client.query(`SELECT count(*) FROM asstats WHERE transit_length_invalid_${family} > 0 AND vantage_point=$1;`, [req.params.vp]);

    let prefixRes = await client.query(`select sum(origin_valid_${family}) + sum(origin_unknown_${family}) + sum(origin_as_invalid_${family}) + sum(origin_length_invalid_${family}) as totalsum, sum(origin_valid_${family}) as valid, sum(origin_unknown_${family}) as unknown, sum(origin_as_invalid_${family}) as as_invalid, sum(origin_length_invalid_${family}) as length_invalid from asstats WHERE vantage_point=$1;`, [req.params.vp]);
    let prefixStats = prefixRes.rows[0];

    res.send({
      totalAsCount: asCount.rows[0]['count'],
      originAsCount: originAsCount.rows[0]['count'],
      transitAsCount: transitAsCount.rows[0]['count'],
      originAsOnlyUnknownCount: originAsOnlyUnknownCount.rows[0]['count'],
      originAsOnlyValidCount: originAsOnlyValidCount.rows[0]['count'],
      originAsOnlyValidAndUnknownCount: originAsOnlyValidAndUnknownCount.rows[0]['count'],
      originAsMixedStatusCount: originAsMixedStatusCount.rows[0]['count'],
      originAsOnlyInvalidCount: originAsOnlyInvalidCount.rows[0]['count'],
      originValidAsCount: originValidAsCount.rows[0]['count'],
//      originUnknownAsCount: originUnknownAsCount.rows[0]['count'],
      originAsInvalidAsCount: originAsInvalidAsCount.rows[0]['count'],
      originLengthInvalidAsCount: originLengthInvalidAsCount.rows[0]['count'],
      transitValidAsCount: transitValidAsCount.rows[0]['count'],
//      transitUnknownAsCount: transitUnknownAsCount.rows[0]['count'],
      transitAsInvalidAsCount: transitAsInvalidAsCount.rows[0]['count'],
      transitLengthInvalidAsCount: transitLengthInvalidAsCount.rows[0]['count'],
      transitAsOnlyValidAndUnknownCount: transitAsOnlyValidAndUnknownCount.rows[0]['count'],
      transitAsInvalidCount: transitAsInvalidCount.rows[0]['count'],
      transitAsLengthInvalidCount: transitAsLengthInvalidCount.rows[0]['count'],
      transitAsMixInvalidCount: transitAsMixInvalidCount.rows[0]['count'],
      totalPrefixCount: prefixStats['totalsum'],
      validPrefixCount: prefixStats['valid'],
      unknownPrefixCount: prefixStats['unknown'],
      asInvalidPrefixCount: prefixStats['as_invalid'],
      lengthInvalidPrefixCount: prefixStats['length_invalid']
    });
  });

publicRouter.route('/as-resources/:vp/:family')
  .get(async (req, res) => {
    let roasQuery = client.query('SELECT ta, asn, count(*) as count FROM roas WHERE family=$1 GROUP BY ta, asn;', [req.params.family]);
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

publicRouter.route('/ases/:vp/:family')
  .get(async (req, res) => {
    let family = req.params.family === 'v4' ? 'v4' : 'v6';
    let ases = await client.query(`SELECT asn,
      origin_valid_${family} + origin_as_invalid_${family} + origin_length_invalid_${family} + origin_unknown_${family} as total_originated, origin_valid_${family} as origin_valid, origin_as_invalid_${family} + origin_length_invalid_${family} as origin_invalid,
      transit_valid_${family} + transit_as_invalid_${family} + transit_length_invalid_${family} + transit_unknown_${family} as total_transited, transit_valid_${family} as transit_valid, transit_as_invalid_${family} + transit_length_invalid_${family} as transit_invalid,
      min_distance
      FROM asstats
      WHERE vantage_point = \$1;`, [req.params.vp]);

    res.send(ases.rows);
  });

router.use('/',
  publicRouter
);

module.exports = router;
