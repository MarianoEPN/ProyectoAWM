const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize.config');

const Usuario = sequelize.define('Usuario', {
    IdUsuario: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    NombreUsuario: 
    { 
        type: DataTypes.STRING(100), 
        allowNull: false, 
        unique: true 
    },
    PasswordHash: 
    { 
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    Rol: 
    { 
        type: DataTypes.ENUM('Administrador', 'Validador'), 
        allowNull: false 
    },
    EstadoActivo: 
    { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
    }
    
}, { tableName: 'Usuario', timestamps: false });

module.exports = Usuario;