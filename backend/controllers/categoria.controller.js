const { CategoriaProducto } = require('../models/asociaciones');
const sequelize = require('../config/sequelize.config');
const { Op } = require('sequelize');

exports.listar = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await CategoriaProducto.findAndCountAll({
            limit, offset,
            attributes: [
                ['idCategoria', 'idCategoria'],
                ['nombreCategoria', 'nombre'],
                'descripcion',
                // Subconsulta SQL pura en Sequelize para calcular métrica transaccional in-situ
                [sequelize.literal('(SELECT COUNT(*) FROM Vendedor_Categoria WHERE Vendedor_Categoria.idCategoria = CategoriaProducto.idCategoria)'), 'totalVendedores']
            ]
        });

        res.status(200).json({
            metadata: {
                totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, limit,
                nextPage: page < Math.ceil(count / limit) ? `/categorias?page=${page + 1}&limit=${limit}` : null,
                prevPage: page > 1 ? `/categorias?page=${page - 1}&limit=${limit}` : null
            },
            data: rows
        });
    } catch (error) { next(error); }
};

exports.obtenerPorId = async (req, res, next) => {
    try {
        const categoria = await CategoriaProducto.findByPk(req.params.id, {
            attributes: [
                ['idCategoria', 'idCategoria'],
                ['nombreCategoria', 'nombre'],
                'descripcion',
                [sequelize.literal(`(SELECT COUNT(*) FROM Vendedor_Categoria WHERE Vendedor_Categoria.idCategoria = ${req.params.id})`), 'totalVendedores']
            ]
        });
        if (!categoria) return res.status(404).json({ error: true, statusCode: 404, message: "No se encontró ninguna categoría registrada con el id proporcionado." });
        res.status(200).json(categoria);
    } catch (error) { next(error); }
};

exports.crear = async (req, res, next) => {
    try {
        const { nombre, descripcion } = req.body;
        if (!nombre) return res.status(400).json({ error: true, statusCode: 400, message: "El cuerpo de la petición tiene un formato inválido o faltan campos obligatorios." });
        
        const existe = await CategoriaProducto.findOne({ where: { nombreCategoria: nombre } });
        if (existe) return res.status(409).json({ error: true, statusCode: 409, message: "Violación de unicidad: ya existe una categoría con ese mismo nombre." });

        const nueva = await CategoriaProducto.create({ nombreCategoria: nombre, descripcion });
        res.status(201).json({
            idCategoria: nueva.idCategoria, nombre: nueva.nombreCategoria, descripcion: nueva.descripcion, totalVendedores: 0
        });
    } catch (error) { next(error); }
};

exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, estadoActivo } = req.body;
        const cat = await CategoriaProducto.findByPk(id);
        if (!cat) return res.status(404).json({ error: true, statusCode: 404, message: "El id de la categoría en la ruta no existe." });

        if (nombre) {
            const conf = await CategoriaProducto.findOne({ where: { nombreCategoria: nombre, idCategoria: { [Op.ne]: id } } });
            if (conf) return res.status(409).json({ error: true, statusCode: 409, message: "Se intenta usar un nombre que ya pertenece a otra categoría." });
        }

        await cat.update({ nombreCategoria: nombre || cat.nombreCategoria, descripcion, estadoActivo });
        
        const count = await sequelize.models.Vendedor_Categoria.count({ where: { idCategoria: id } });
        res.status(200).json({
            idCategoria: cat.idCategoria, nombre: cat.nombreCategoria, descripcion: cat.descripcion, totalVendedores: count
        });
    } catch (error) { next(error); }
};