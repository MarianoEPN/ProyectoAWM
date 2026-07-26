exports.verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                error: true,
                statusCode: 403,
                message: "El token es válido, pero el usuario no tiene el rol necesario para realizar esta acción."
            });
        }
        next();
    };
};