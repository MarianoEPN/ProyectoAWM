const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize.config');

const Habitante = sequelize.define('Habitante', {
    idHabitante: 
    { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    DocumentoIdentidad: 
    { 
        type: DataTypes.STRING(20), 
        allowNull: false, 
        unique: true 
    },
    Nombres: 
    { 
        type: 
        DataTypes.STRING(100), 
        allowNull: false 
    },
    Apellidos: 
    { 
        type: DataTypes.STRING(100), 
        allowNull: false 
    },
    NumeroContacto: 
    { 
        type: DataTypes.STRING(20), 
        allowNull: true 
    },
    EstadoActivo: 
    { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
    }
    
}, { tableName: 'Habitante', timestamps: false });

module.exports = Habitante;