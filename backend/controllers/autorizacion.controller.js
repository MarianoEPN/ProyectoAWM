const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models/asociaciones');
const { secret, expiresIn } = require('../config/jwt');

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: true, statusCode: 400, message: "Debe ingresar usuario y contraseña." });
        }

        const user = await Usuario.findOne({ where: { NombreUsuario: username, EstadoActivo: true } });
        const validPassword = user && (await bcrypt.compare(password, user.PasswordHash) || password === user.PasswordHash);
        
        if (!validPassword) {
            return res.status(401).json({ error: true, statusCode: 401, message: "Credenciales de acceso incorrectas." });
        }

        const token = jwt.sign({ id: user.IdUsuario, rol: user.Rol }, secret, { expiresIn });
        res.status(200).json({ token, rol: user.Rol, username: user.NombreUsuario });
    } catch (error) { next(error); }
};