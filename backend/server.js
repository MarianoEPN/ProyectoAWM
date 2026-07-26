const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/sequelize.config');

// Importar asociaciones para inicializar el grafo relacional en la memoria del ORM
require('./models/asociaciones');

const app = express();

// Middlewares globales (10mb para admitir fotos en Base64 o URLs efímeras en Azure)
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: '*', // En producción, cambiar por el dominio real de tu Azure Static Web App
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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