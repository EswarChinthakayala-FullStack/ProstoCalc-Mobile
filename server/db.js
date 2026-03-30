const mysql = require('mysql2');
require('dotenv').config();

const poolConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'prostocalc_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Use socket connection only when DB_SOCKET is explicitly set (local XAMPP)
// For deployment, leave DB_SOCKET empty and use TCP connection via DB_HOST
if (process.env.DB_SOCKET) {
    poolConfig.socketPath = process.env.DB_SOCKET;
}

const pool = mysql.createPool(poolConfig);

const promisePool = pool.promise();

module.exports = promisePool;
