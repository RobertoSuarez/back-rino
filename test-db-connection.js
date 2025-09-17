require('dotenv').config();
const { Client } = require('pg');

// Configuración de la conexión
const config = {
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  ssl: false
};

// Si SSL está habilitado, configurarlo adecuadamente
if (process.env.DATABASE_SSL === 'true') {
  config.ssl = {
    rejectUnauthorized: process.env.DATABASE_REJECT_UNAUTHORIZED !== 'false'
  };
  
  // Si hay un certificado CA en las variables de entorno
  if (process.env.DATABASE_CA_CERT) {
    config.ssl.ca = process.env.DATABASE_CA_CERT;
  }
}

console.log('Configuración de conexión (sin contraseña):', {
  ...config,
  password: '********'
});

// Crear cliente y conectar
const client = new Client(config);

// Intentar conectar
console.log('Intentando conectar a la base de datos...');
client.connect()
  .then(() => {
    console.log('¡Conexión exitosa!');
    // Consulta de prueba
    return client.query('SELECT VERSION()');
  })
  .then(result => {
    console.log('Versión de PostgreSQL:', result.rows[0].version);
    return client.end();
  })
  .then(() => {
    console.log('Conexión cerrada correctamente');
  })
  .catch(err => {
    console.error('Error de conexión:', err);
  });
