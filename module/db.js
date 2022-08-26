const pg = require('pg');

const pool = new pg.Pool({
    user: "postgres",
    host: "172.30.142.51",
    database: "postgres",
    password: "postgres",
    port: 5432,
});

exports.pool = pool;