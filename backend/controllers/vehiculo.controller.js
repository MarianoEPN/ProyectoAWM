const { Vehiculo, Habitante } = require('../models/asociaciones');
const crypto = require('crypto');
const { Op } = require('sequelize');

exports.listar = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Vehiculo.findAndCountAll({
            limit, offset,
            include: [{
                model: Habitante, as: 'propietario',
                attributes: [['Nombres', 'nombres'], ['Apellidos', 'apellidos']]
            }]
        });

        const dataMapeada = rows.map(v => {
            const obj = v.toJSON();
            obj.nombrePropietario = obj.propietario ? `${obj.propietario.nombres} ${obj.propietario.apellidos}` : 'Desconocido';
            delete obj.propietario;
            return obj;
        });

        res.status(200).json({
            metadata: {
                totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, limit,
                nextPage: page < Math.ceil(count / limit) ? `/vehiculos?page=${page + 1}&limit=${limit}` : null,
                prevPage: page > 1 ? `/vehiculos?page=${page - 1}&limit=${limit}` : null
            },
            data: dataMapeada
        });
    } catch (error) { next(error); }
};

exports.obtenerPorId = async (req, res, next) => {
    try {
        const vehiculo = await Vehiculo.findByPk(req.params.id, {
            include: [{ model: Habitante, as: 'propietario' }]
        });
        if (!vehiculo) {
            return res.status(404).json({ error: true, statusCode: 404, message: "No se encontró ningún vehículo registrado con el id proporcionado." });
        }
        
        const obj = vehiculo.toJSON();
        obj.nombrePropietario = obj.propietario ? `${obj.propietario.Nombres} ${obj.propietario.Apellidos}` : 'Desconocido';
        delete obj.propietario;
        res.status(200).json(obj);
    } catch (error) { next(error); }
};

exports.crear = async (req, res, next) => {
    try {
        const { placa, modelo, color, idHabitante, fechaEmision, fechaExpiracion, estadoActivo } = req.body;
        if (!placa || !modelo || !color || !idHabitante || !fechaEmision || !fechaExpiracion) {
            return res.status(400).json({ error: true, statusCode: 400, message: "El cuerpo de la petición tiene campos obligatorios faltantes (como idHabitante)." });
        }

        const habitante = await Habitante.findByPk(idHabitante);
        if (!habitante) {
            return res.status(404).json({ error: true, statusCode: 404, message: "El idHabitante proporcionado no existe en el sistema legacy de la comunidad." });
        }

        const placaExistente = await Vehiculo.findOne({ where: { placa } });
        if (placaExistente) {
            return res.status(409).json({ error: true, statusCode: 409, message: "La placa ingresada ya se encuentra registrada en el sistema." });
        }

        const codigoQr = `vehiculo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const nuevoVehiculo = await Vehiculo.create({
            placa, modelo, color, idHabitante, fechaEmision, fechaExpiracion,
            estadoActivo: estadoActivo || 'VIGENTE', codigoQr
        });

        res.status(201).json({
            idVehiculo: nuevoVehiculo.idVehiculo, placa, modelo, color, idHabitante,
            nombrePropietario: `${habitante.Nombres} ${habitante.Apellidos}`,
            fechaEmision, fechaExpiracion, estadoActivo: nuevoVehiculo.estadoActivo, codigoQr
        });
    } catch (error) { next(error); }
};

exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { placa, modelo, color, idHabitante, fechaEmision, fechaExpiracion, estadoActivo } = req.body;

        const vehiculo = await Vehiculo.findByPk(id);
        if (!vehiculo) return res.status(404).json({ error: true, statusCode: 404, message: "No se encontró ningún vehículo registrado con el ID proporcionado." });

        const habitante = await Habitante.findByPk(idHabitante);
        if (!habitante) return res.status(404).json({ error: true, statusCode: 404, message: "El idHabitante enviado en el body no existe en el sistema legacy." });

        const conflicto = await Vehiculo.findOne({ where: { idVehiculo: { [Op.ne]: id }, placa } });
        if (conflicto) return res.status(409).json({ error: true, statusCode: 409, message: "La placa ya pertenece a otro vehículo distinto al que se está editando." });

        await vehiculo.update({ placa, modelo, color, idHabitante, fechaEmision, fechaExpiracion, estadoActivo });

        res.status(200).json({
            idVehiculo: vehiculo.idVehiculo, placa, modelo, color, idHabitante,
            nombrePropietario: `${habitante.Nombres} ${habitante.Apellidos}`,
            fechaEmision, fechaExpiracion, estadoActivo, codigoQr: vehiculo.codigoQr
        });
    } catch (error) { next(error); }
};

exports.validarAcceso = async (req, res, next) => {
    try {
        const { tipoBusqueda, valor } = req.query;
        if (!tipoBusqueda || !valor || !['placa', 'qr'].includes(tipoBusqueda)) {
            return res.status(400).json({ error: true, statusCode: 400, message: "Falta parámetro o tipoBusqueda no es válido (use placa o qr)." });
        }

        const columna = tipoBusqueda === 'placa' ? 'placa' : 'codigoQr';
        const vehiculo = await Vehiculo.findOne({
            where: { [columna]: valor },
            include: [{ model: Habitante, as: 'propietario' }]
        });

        if (!vehiculo) {
            return res.status(404).json({ error: true, statusCode: 404, message: "No se encontró ningún vehículo que coincida con el parámetro de búsqueda ingresado." });
        }

        // RF15: Ocultar número de contacto o identificación personal del propietario al guardia
        res.status(200).json({
            placa: vehiculo.placa,
            modelo: vehiculo.modelo,
            color: vehiculo.color,
            nombrePropietario: vehiculo.propietario ? `${vehiculo.propietario.Nombres} ${vehiculo.propietario.Apellidos}` : 'Desconocido',
            fechaExpiracion: vehiculo.fechaExpiracion,
            estadoActivo: vehiculo.estadoActivo
        });
    } catch (error) { next(error); }
};

// UC-11: Dar de baja vehículo sin eliminar historial
exports.darDeBaja = async (req, res, next) => {
    try {
        const vehiculo = await Vehiculo.findByPk(req.params.id);
        if (!vehiculo) return res.status(404).json({ error: true, statusCode: 404, message: "Vehículo no encontrado." });
        
        await vehiculo.update({ estadoActivo: 'REVOCADA', codigoQr: `INVALIDO-${Date.now()}-${vehiculo.idVehiculo}` });
        res.status(200).json({ message: "Vehículo desactivado e invalidado de los escáneres en portería." });
    } catch (error) { next(error); }
};

// UC-12: Regenerar QR vehículo
exports.regenerarQr = async (req, res, next) => {
    try {
        const vehiculo = await Vehiculo.findByPk(req.params.id);
        if (!vehiculo) return res.status(404).json({ error: true, statusCode: 404, message: "Vehículo no encontrado." });
        
        const nuevoQr = `vehiculo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        await vehiculo.update({ codigoQr: nuevoQr });
        res.status(200).json({ message: "Código QR regenerado exitosamente.", codigoQr: nuevoQr });
    } catch (error) { next(error); }
};