#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE rpkilg;
    GRANT ALL PRIVILEGES ON DATABASE rpkilg TO dev;

    \c rpkilg;
    CREATE TABLE prefixes (
      gw text,
      prefix text,
      prefixlen integer,
      originas bigint,
      nexthop text,
      nexthopas bigint,
      aspath text
    );
    CREATE INDEX index_prefixes_on_prefix ON prefixes USING btree(gw, prefix, prefixlen);
    CREATE INDEX index_prefixes_on_originas ON prefixes USING btree(gw, originas);

    CREATE TABLE roas (
      asn bigint,
      prefix text,
      prefixlen int,
      maxlength int,
      ta text
    );
    CREATE INDEX index_roas_on_prefix ON roas USING btree(prefix, prefixlen);

    CREATE TABLE asstats (
      asn bigint,
      transit_valid int,
      transit_unknown int,
      transit_as_invalid int,
      transit_length_invalid int,
      origin_valid int,
      origin_unknown int,
      origin_as_invalid int,
      origin_length_invalid int,
      vantage_point varchar(255),
      min_distance int,
      PRIMARY KEY(asn, vantage_point)
    );
EOSQL
