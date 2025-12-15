const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect(error => {
  if (error) throw error;
  console.log("Successfully connected to the MySQL database.");
});

// Initialize Users Table if not exists [cite: 31, 33]
const initQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    eth_address VARCHAR(42) NOT NULL,
    encrypted_key TEXT NOT NULL
  )
`;

connection.query(initQuery, (err, result) => {
  if (err) throw err;
  console.log("Users table verified/created.");
});

module.exports = connection;