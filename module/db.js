const pg = require('pg');

const pool = new pg.Pool({
    user: "postgres",
    host: "172.17.0.10",
    database: "postgres",
    password: "postgres",
    port: 5432,
});

exports.pool = pool;