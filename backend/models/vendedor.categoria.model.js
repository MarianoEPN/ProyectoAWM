const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize.config');

const Vendedor_Categoria = sequelize.define('Vendedor_Categoria', {
    id: 
    { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    idVendedor: 
    { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    idCategoria: 
    { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    }
}, { tableName: 'Vendedor_Categoria', timestamps: false });

module.exports = Vendedor_Categoria;