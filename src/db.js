'use strict';

const hasPostgres = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);

module.exports = hasPostgres
  ? require('./db/postgres')
  : require('./db/json');