const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:     process.env.MYSQLHOST     || "localhost",
  user:     process.env.MYSQLUSER     || "root",
  password: process.env.MYSQLPASSWORD || "mysqlpassword",
  port:     process.env.MYSQLPORT     || 3306,
  database: process.env.MYSQLDATABASE || "chamados_etec",
  waitForConnections: true,
  connectionLimit: 10,
});

async function inicializar() {

  if (!process.env.MYSQLHOST) {
    const conn = await mysql.createConnection({
      host:     "localhost",
      user:     "root",
      password: process.env.MYSQLPASSWORD || "mysqlpassword",
      port:     3306,
    });
    await conn.query(`
      CREATE DATABASE IF NOT EXISTS chamados_etec
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    await conn.end();
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chamados (
      id        BIGINT       PRIMARY KEY,
      nome      VARCHAR(255) NOT NULL,
      turma     VARCHAR(100),
      tipo      VARCHAR(100) NOT NULL,
      descricao TEXT         NOT NULL,
      data      VARCHAR(50)  NOT NULL,
      status    VARCHAR(50)  NOT NULL DEFAULT 'Aberto'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id      INT          PRIMARY KEY AUTO_INCREMENT,
      usuario VARCHAR(100) NOT NULL UNIQUE,
      senha   VARCHAR(255) NOT NULL
    )
  `);

  await pool.query(`
    INSERT IGNORE INTO admins (usuario, senha)
    VALUES ('ETECCPS', 'ETECCPS1234')
  `);

  console.log("✅ Banco de dados MySQL conectado e pronto!");
}

inicializar().catch(err => {
  console.error("❌ Erro ao conectar no MySQL:", err.message);
});

module.exports = pool;
