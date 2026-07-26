const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize.config');

const CategoriaProducto = sequelize.define('CategoriaProducto', {
    idCategoria: 
    { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    nombreCategoria: 
    { 
        type: DataTypes.STRING(100), 
        allowNull: false, 
        unique: true 
    },
    descripcion: 
    { 
        type: DataTypes.TEXT, 
        allowNull: true 
    },
    estadoActivo: 
    { 
        type: DataTypes.STRING(20), 
        defaultValue: 'VIGENTE' 
    }
}, { tableName: 'CategoriaProducto', timestamps: false });

module.exports = CategoriaProducto;