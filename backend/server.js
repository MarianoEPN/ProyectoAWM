const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/sequelize.config');
const path = require('path');

// Importar asociaciones para inicializar el grafo relacional en la memoria del ORM
require('./models/asociaciones');

const app = express();

// Middlewares globales (10mb para admitir fotos en Base64 o URLs efímeras en Azure)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const allowedOrigins = [
  'http://localhost:15163',
  'http://localhost:5173',
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map((url) => url.trim()) : []),
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS no permitido: ${origin}`), false);
    }
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Conexión de rutas modulares respetando tus nombres exactos
app.use('/autorizacion', require('./routes/autorizacion.routes'));
app.use('/categorias', require('./routes/categoria.routes'));
app.use('/vendedores', require('./routes/vendedor.routes'));
app.use('/vehiculos', require('./routes/vehiculo.routes'));

app.get('/', (req, res) => res.status(200).send('API Backend San José de Cocotog - Monolito Modular Activo 🚀'));

// Manejo de errores globales para evitar caídas del contenedor en Azure App Service
app.use((err, req, res, next) => {
    console.error('Error no controlado:', err.stack);
    res.status(500).json({
        error: true,
        statusCode: 500,
        message: "Fallo inesperado en el servidor o pérdida de conexión con la base de datos."
    });
});

const PORT = process.env.PORT || 3000;

sequelize.authenticate()
    .then(() => {
        console.log('Conexión exitosa');
        return sequelize.sync(); 
    })
    .then(() => {
        app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));
    })
    .catch(err => console.error('Error al conectar con la BD:', err));