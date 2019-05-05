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
EOSQL
