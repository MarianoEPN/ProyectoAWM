const { Vendedor, CategoriaProducto, Habitante } = require('../models/asociaciones');
const crypto = require('crypto');
const { Op } = require('sequelize');

exports.listar = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Vendedor.findAndCountAll({
            limit, offset,
            include: [{
                model: CategoriaProducto, as: 'categorias',
                attributes: [['idCategoria', 'idCategoria'], ['nombreCategoria', 'nombre']],
                through: { attributes: [] }
            }],
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);
        res.status(200).json({
            metadata: {
                totalItems: count, totalPages, currentPage: page, limit,
                nextPage: page < totalPages ? `/vendedores?page=${page + 1}&limit=${limit}` : null,
                prevPage: page > 1 ? `/vendedores?page=${page - 1}&limit=${limit}` : null
            },
            data: rows
        });
    } catch (error) { next(error); }
};

exports.obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: true, statusCode: 400, message: "El parámetro id tiene un formato inválido." });
        }

        const vendedor = await Vendedor.findByPk(id, {
            include: [{
                model: CategoriaProducto, as: 'categorias',
                attributes: [['idCategoria', 'idCategoria'], ['nombreCategoria', 'nombre']],
                through: { attributes: [] }
            }]
        });

        if (!vendedor) {
            return res.status(404).json({ error: true, statusCode: 404, message: "No se encontró ningún vendedor registrado con el id proporcionado." });
        }

        res.status(200).json(vendedor);
    } catch (error) { next(error); }
};

exports.crear = async (req, res, next) => {
    try {
        const { cedula, nombre, foto, nResolucion, fechaEmision, fechaExpiracion, estadoActivo, idHabitante, categoriasIds } = req.body;

        if (!cedula || !nombre || !nResolucion || !fechaEmision || !fechaExpiracion || !categoriasIds) {
            return res.status(400).json({ error: true, statusCode: 400, message: "El cuerpo de la petición tiene campos obligatorios faltantes." });
        }
        if (new Date(fechaExpiracion) <= new Date(fechaEmision)) {
            return res.status(400).json({ error: true, statusCode: 400, message: "La fecha de expiración es anterior o igual a la de emisión." });
        }

        if (idHabitante) {
            const hab = await Habitante.findByPk(idHabitante);
            if (!hab) {
                return res.status(404).json({ error: true, statusCode: 404, message: "El idHabitante enviado no existe en el sistema legacy." });
            }
        }

        const existe = await Vendedor.findOne({ where: { [Op.or]: [{ cedula }, { nResolucion }] } });
        if (existe) {
            return res.status(409).json({ error: true, statusCode: 409, message: "La cédula proporcionada o el número de resolución ya se encuentran registrados en el sistema." });
        }

        const codigoQr = `vendedor-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const nuevoVendedor = await Vendedor.create({
            cedula, nombre, foto: foto || null, nResolucion, fechaEmision, fechaExpiracion,
            estadoActivo: estadoActivo || 'VIGENTE', codigoQr, idHabitante: idHabitante || null
        });

        if (categoriasIds.length > 0) {
            await nuevoVendedor.setCategorias(categoriasIds);
        }

        const resultado = await Vendedor.findByPk(nuevoVendedor.idVendedor, {
            include: [{
                model: CategoriaProducto, as: 'categorias',
                attributes: [['idCategoria', 'idCategoria'], ['nombreCategoria', 'nombre']],
                through: { attributes: [] }
            }]
        });

        res.status(201).json(resultado);
    } catch (error) { next(error); }
};

exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { cedula, nombre, foto, nResolucion, fechaEmision, fechaExpiracion, estadoActivo, idHabitante, categoriasIds } = req.body;

        const vendedor = await Vendedor.findByPk(id);
        if (!vendedor) {
            return res.status(404).json({ error: true, statusCode: 404, message: "No se encontró ningún vendedor registrado con el ID proporcionado." });
        }

        const conflicto = await Vendedor.findOne({
            where: {
                idVendedor: { [Op.ne]: id },
                [Op.or]: [{ cedula }, { nResolucion }]
            }
        });
        if (conflicto) {
            return res.status(409).json({ error: true, statusCode: 409, message: "La cédula o resolución ya pertenece a otro vendedor registrado." });
        }

        await vendedor.update({
            cedula, nombre, foto, nResolucion, fechaEmision, fechaExpiracion, estadoActivo, idHabitante: idHabitante || null
        });

        if (categoriasIds && Array.isArray(categoriasIds)) {
            await vendedor.setCategorias(categoriasIds); // Reemplaza categorías previas
        }

        const actualizado = await Vendedor.findByPk(id, {
            include: [{
                model: CategoriaProducto, as: 'categorias',
                attributes: [['idCategoria', 'idCategoria'], ['nombreCategoria', 'nombre']],
                through: { attributes: [] }
            }]
        });

        res.status(200).json(actualizado);
    } catch (error) { next(error); }
};

// Endpoint para App Móvil de Guardias in-situ (Oculta datos sensibles según RF15)
exports.validarAcceso = async (req, res, next) => {
    try {
        const { tipoBusqueda, valor } = req.query;
        if (!tipoBusqueda || !valor || !['cedula', 'resolucion', 'qr'].includes(tipoBusqueda)) {
            return res.status(400).json({ error: true, statusCode: 400, message: "Falta parámetro o tipoBusqueda no permitido (use cedula, resolucion, qr)." });
        }

        const columna = tipoBusqueda === 'cedula' ? 'cedula' : tipoBusqueda === 'resolucion' ? 'nResolucion' : 'codigoQr';
        const vendedor = await Vendedor.findOne({
            where: { [columna]: valor },
            attributes: ['cedula', 'nombre', 'foto', 'nResolucion', 'fechaExpiracion', 'estadoActivo'], // Cero teléfonos o direcciones (RF15)
            include: [{
                model: CategoriaProducto, as: 'categorias',
                attributes: [['idCategoria', 'idCategoria'], ['nombreCategoria', 'nombre']],
                through: { attributes: [] }
            }]
        });

        if (!vendedor) {
            return res.status(404).json({ error: true, statusCode: 404, message: "No se encontró ningún vendedor que coincida con el parámetro de búsqueda ingresado." });
        }

        res.status(200).json(vendedor);
    } catch (error) { next(error); }
};

// UC-03: Dar de baja sin eliminación física
exports.darDeBaja = async (req, res, next) => {
    try {
        const vendedor = await Vendedor.findByPk(req.params.id);
        if (!vendedor) return res.status(404).json({ error: true, statusCode: 404, message: "Vendedor no encontrado." });
        
        await vendedor.update({ estadoActivo: 'REVOCADA', codigoQr: `INVALIDO-${Date.now()}-${vendedor.idVendedor}` });
        res.status(200).json({ message: "Vendedor dado de baja y su código QR ha sido invalidado." });
    } catch (error) { next(error); }
};

// UC-04: Regenerar QR manualmente
exports.regenerarQr = async (req, res, next) => {
    try {
        const vendedor = await Vendedor.findByPk(req.params.id);
        if (!vendedor) return res.status(404).json({ error: true, statusCode: 404, message: "Vendedor no encontrado." });
        
        const nuevoQr = `vendedor-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        await vendedor.update({ codigoQr: nuevoQr });
        res.status(200).json({ message: "Código QR regenerado exitosamente.", codigoQr: nuevoQr });
    } catch (error) { next(error); }
};