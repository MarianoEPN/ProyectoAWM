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

        // 1. Validación de campos obligatorios básicos
        if (!cedula || !nombre || !nResolucion || !fechaEmision || !fechaExpiracion || !categoriasIds) {
            return res.status(400).json({ 
                error: true, 
                statusCode: 400, 
                message: "El cuerpo de la petición tiene campos obligatorios faltantes o inconsistencias." 
            });
        }

        // 2. Validación de coherencia en fechas
        if (new Date(fechaExpiracion) <= new Date(fechaEmision)) {
            return res.status(400).json({ 
                error: true, 
                statusCode: 400, 
                message: "La fecha de expiración no puede ser anterior o igual a la fecha de emisión." 
            });
        }

        // 3. Validación de existencia en el Sistema Legacy (si enviaron un idHabitante)
        if (idHabitante) {
            const hab = await Habitante.findByPk(idHabitante);
            if (!hab) {
                return res.status(404).json({ 
                    error: true, 
                    statusCode: 404, 
                    message: "El idHabitante proporcionado no existe en el sistema legacy de la comunidad." 
                });
            }
        }

        // 4. Validación de Unicidad (Cédula o Resolución duplicadas - Error 409)
        const existe = await Vendedor.findOne({ where: { [Op.or]: [{ cedula }, { nResolucion }] } });
        if (existe) {
            return res.status(409).json({ 
                error: true, 
                statusCode: 409, 
                message: "La cédula proporcionada o el número de resolución ya se encuentran registrados en el sistema." 
            });
        }

        // 🟢 5. REGLA DE NEGOCIO: Derivación automática de expiración
        // Si la fecha de expiración es menor a hoy, el estado se fuerza transaccionalmente a 'REVOCADA'
        const fechaActual = new Date().toISOString().split('T')[0];
        let estadoCalculado = estadoActivo || 'VIGENTE';
        if (new Date(fechaExpiracion) < new Date(fechaActual)) {
            estadoCalculado = 'REVOCADA';
        }

        // 🟢 6. MANEJO DE IMAGEN EN DISCO: Guardamos solo la ruta relativa de la base de datos
        let fotoRuta = foto || null;
        if (req.file) {
            // Multer ya guardó el archivo físico; aquí solo asignamos el path: /uploads/nombre-del-archivo.png
            fotoRuta = `/uploads/${req.file.filename}`;
        }

        // 7. Generación automática del código QR cifrado por el backend
        const codigoQr = `vendedor-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        
        // 8. Creación del registro en MySQL
        const nuevoVendedor = await Vendedor.create({
            cedula, 
            nombre, 
            foto: fotoRuta, 
            nResolucion, 
            fechaEmision, 
            fechaExpiracion,
            estadoActivo: estadoCalculado, 
            codigoQr, 
            idHabitante: idHabitante || null
        });

        // 9. Asignación de categorías (Soporta arreglos o strings JSON que llegan desde form-data)
        let arrayCategorias = categoriasIds;
        if (typeof categoriasIds === 'string') {
            try { arrayCategorias = JSON.parse(categoriasIds); } catch (e) { arrayCategorias = [parseInt(categoriasIds)]; }
        }

        if (Array.isArray(arrayCategorias) && arrayCategorias.length > 0) {
            await nuevoVendedor.setCategorias(arrayCategorias);
        }

        // 10. Consultar el registro final con las categorías unidas para devolver en el formato oficial
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

        // 1. Verificar que el vendedor exista
        const vendedor = await Vendedor.findByPk(id);
        if (!vendedor) {
            return res.status(404).json({ 
                error: true, 
                statusCode: 404, 
                message: "No se encontró ningún vendedor registrado con el ID proporcionado." 
            });
        }

        // 2. Validar que la nueva cédula o resolución no pertenezcan a OTRO vendedor diferente
        const conflicto = await Vendedor.findOne({
            where: {
                idVendedor: { [Op.ne]: id },
                [Op.or]: [{ cedula }, { nResolucion }]
            }
        });
        if (conflicto) {
            return res.status(409).json({ 
                error: true, 
                statusCode: 409, 
                message: "La cédula o resolución ya pertenece a otro vendedor registrado en el sistema." 
            });
        }

        // 3. Validar existencia de habitante si se está editando esa relación
        if (idHabitante) {
            const hab = await Habitante.findByPk(idHabitante);
            if (!hab) {
                return res.status(404).json({ 
                    error: true, 
                    statusCode: 404, 
                    message: "El idHabitante proporcionado no existe en el sistema legacy de la comunidad." 
                });
            }
        }

        // 🟢 4. REGLA DE NEGOCIO EN EDICIÓN: Derivación automática por expiración
        const fechaActual = new Date().toISOString().split('T')[0];
        let estadoCalculado = estadoActivo || vendedor.estadoActivo;
        if (new Date(fechaExpiracion) < new Date(fechaActual)) {
            estadoCalculado = 'REVOCADA';
        }

        // 🟢 5. IMAGEN EN EDICIÓN: Si mandaron foto nueva por formulario, toma la nueva ruta; si no, conserva la anterior
        let fotoRuta = foto !== undefined ? foto : vendedor.foto;
        if (req.file) {
            fotoRuta = `/uploads/${req.file.filename}`;
        }

        // 6. Actualización transaccional del registro
        await vendedor.update({
            cedula, 
            nombre, 
            foto: fotoRuta, 
            nResolucion, 
            fechaEmision, 
            fechaExpiracion, 
            estadoActivo: estadoCalculado, 
            idHabitante: idHabitante || null
        });

        // 7. Reemplazo total de categorías si fueron enviadas
        if (categoriasIds !== undefined) {
            let arrayCategorias = categoriasIds;
            if (typeof categoriasIds === 'string') {
                try { arrayCategorias = JSON.parse(categoriasIds); } catch (e) { arrayCategorias = [parseInt(categoriasIds)]; }
            }
            if (Array.isArray(arrayCategorias)) {
                await vendedor.setCategorias(arrayCategorias);
            }
        }

        // 8. Devolver el objeto actualizado con sus relaciones
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
            return res.status(400).json({ error: true, statusCode: 400, message: "Parámetros inválidos." });
        }

        const columna = tipoBusqueda === 'cedula' ? 'cedula' : tipoBusqueda === 'resolucion' ? 'nResolucion' : 'codigoQr';
        const vendedor = await Vendedor.findOne({
            where: { [columna]: valor },
            attributes: ['idVendedor', 'cedula', 'nombre', 'foto', 'nResolucion', 'fechaExpiracion', 'estadoActivo'],
            include: [{
                model: CategoriaProducto, as: 'categorias',
                attributes: [['idCategoria', 'idCategoria'], ['nombreCategoria', 'nombre']],
                through: { attributes: [] }
            }]
        });

        if (!vendedor) return res.status(404).json({ error: true, statusCode: 404, message: "Vendedor no encontrado." });

        
        const fechaActual = new Date().toISOString().split('T')[0];
        if (vendedor.estadoActivo === 'VIGENTE' && new Date(vendedor.fechaExpiracion) < new Date(fechaActual)) {
            vendedor.estadoActivo = 'REVOCADA';
            await vendedor.update({ estadoActivo: 'REVOCADA' }); // Actualiza MySQL silenciosamente en el fondo
        }

        res.status(200).json({
            cedula: vendedor.cedula,
            nombre: vendedor.nombre,
            foto: vendedor.foto,
            nResolucion: vendedor.nResolucion,
            fechaExpiracion: vendedor.fechaExpiracion,
            estadoActivo: vendedor.estadoActivo,
            categorias: vendedor.categorias
        });
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