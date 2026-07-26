const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');

exports.verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: true,
            statusCode: 401,
            message: "No se envió el token JWT en las cabeceras, tiene un formato incorrecto, o ya expiró."
        });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            error: true,
            statusCode: 401,
            message: "No se envió el token JWT en las cabeceras, tiene un formato incorrecto, o ya expiró."
        });
    }
};

exports.validarPaginacion = (req, res, next) => {
    const { page, limit } = req.query;
    if ((page && isNaN(parseInt(page))) || (limit && isNaN(parseInt(limit)))) {
        return res.status(400).json({
            error: true,
            statusCode: 400,
            message: "Los parámetros de consulta (page o limit) tienen un formato inválido (no son enteros)."
        });
    }
    next();
};