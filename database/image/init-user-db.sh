#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE rpkilg;
    GRANT ALL PRIVILEGES ON DATABASE rpkilg TO dev;

    \c rpkilg;
    CREATE TABLE prefixes (
      gw text,
      family text,
      prefix inet,
      prefixlen integer,
      originas bigint,
      nexthop text,
      nexthopas bigint,
      aspath text
    );
    CREATE INDEX index_prefixes_on_gw_and_family ON prefixes USING btree(gw, family);
    CREATE INDEX index_prefixes_on_gw_and_family_and_prefix ON prefixes USING btree(gw, family, prefix);
    CREATE INDEX index_prefixes_on_originas ON prefixes USING btree(gw, family, originas);
    CREATE INDEX index_prefixes_on_prefix ON prefixes USING gist (prefix inet_ops);

    CREATE TABLE roas (
      asn bigint,
      family text,
      prefix inet,
      prefixlen int,
      maxlength int,
      ta text
    );
    CREATE INDEX index_roas_on_asn ON roas USING btree(asn);
    CREATE INDEX index_roas_on_prefix_and_family ON roas USING btree(family, prefix);
    CREATE INDEX index_roas_on_family_asn ON roas USING btree(family, asn);
    CREATE INDEX index_roas_on_prefix_and_family_asn ON roas USING btree(family, prefix, asn);
    CREATE INDEX index_roas_on_prefix ON roas USING gist (prefix inet_ops);

    CREATE TABLE roas_expanded (
      asn bigint,
      family text,
      prefix inet,
      ta text
    );
    CREATE INDEX ON roas_expanded USING btree(asn);
    CREATE INDEX ON roas_expanded USING btree(family, prefix);
    CREATE INDEX ON roas_expanded USING btree(family, asn);
    CREATE INDEX ON roas_expanded USING btree(family, prefix, asn);
    CREATE INDEX ON roas_expanded USING gist (prefix inet_ops);

    CREATE TABLE prefix_status (
      family text,
      prefix inet
    );
    CREATE INDEX ON prefix_status USING btree(family, prefix);
    CREATE INDEX ON prefix_status USING gist (prefix inet_ops);

    CREATE TABLE asstats (
      asn bigint,
      transit_valid_v4 int,
      transit_unknown_v4 int,
      transit_as_invalid_v4 int,
      transit_length_invalid_v4 int,
      origin_valid_v4 int,
      origin_unknown_v4 int,
      origin_as_invalid_v4 int,
      origin_length_invalid_v4 int,
      transit_valid_v6 int,
      transit_unknown_v6 int,
      transit_as_invalid_v6 int,
      transit_length_invalid_v6 int,
      origin_valid_v6 int,
      origin_unknown_v6 int,
      origin_as_invalid_v6 int,
      origin_length_invalid_v6 int,
      vantage_point varchar(255),
      min_distance int,
      PRIMARY KEY(asn, vantage_point)
    );
EOSQL
