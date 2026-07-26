const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize.config');

const Vehiculo = sequelize.define('Vehiculo', {
    idVehiculo: 
    { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    idHabitante: 
    { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    }, 
    placa: 
    { 
        type: DataTypes.STRING(20), 
        allowNull: false, 
        unique: true 
    },
    modelo: 
    { 
        type: DataTypes.STRING(100), 
        allowNull: false 
    },
    color: 
    { 
        type: DataTypes.STRING(50), 
        allowNull: false 
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
}, { tableName: 'Vehiculo', timestamps: false });

module.exports = Vehiculo;