#!/bin/sh
# Creates the isolated database used by the integration tests.
# Runs only on first initialization of the volume.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
CREATE DATABASE medusa_hive_test OWNER $POSTGRES_USER;
EOSQL
