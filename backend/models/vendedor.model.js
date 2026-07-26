const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize.config');

const Vendedor = sequelize.define('Vendedor', {
    idVendedor: 
    { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true
    },
    idHabitante: 
    { 
        type: DataTypes.INTEGER, 
        allowNull: true 
    }, 
    cedula: 
    { 
        type: DataTypes.STRING(20), 
        allowNull: false, 
        unique: true 
    },
    nombre: 
    { 
        type: DataTypes.STRING(150), 
        allowNull: false 
    },
    foto: 
    { 
        type: DataTypes.TEXT, 
        allowNull: true 
    },
    nResolucion: 
    { 
        type: DataTypes.STRING(100), 
        allowNull: false, 
        unique: true 
    },
    codigoQr: 
    { 
        type: DataTypes.STRING(255), 
        allowNull: false, 
        unique: true 
    },
    fechaEmision: 
    { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
    },
    fechaExpiracion: 
    { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
    },
    estadoActivo: 
    { 
        type: DataTypes.STRING(20), 
        defaultValue: 'VIGENTE' 
    }
}, { tableName: 'Vendedor', timestamps: false });

module.exports = Vendedor;