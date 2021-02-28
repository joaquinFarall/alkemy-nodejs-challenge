const mysql = require('mysql');
const {promisify} = require('util');
const {database} = require('./connection');

const pool = mysql.createPool(database);

pool.getConnection((err, connection) => {
    if(err) return console.log(err);

    if(connection) connection.release();
    console.log('DB is connected');
    
    return;
});

pool.query = promisify(pool.query);

module.exports = pool;