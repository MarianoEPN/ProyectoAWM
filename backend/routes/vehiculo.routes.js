const express = require('express');
const router = express.Router();
const { verificarToken, validarPaginacion } = require('../middleware/autorizacion');
const { verificarRol } = require('../middleware/rol');
const ctrl = require('../controllers/vehiculo.controller');

router.get('/validar', /*verificarToken, verificarRol(['Validador', 'Administrador']),*/ ctrl.validarAcceso);
router.get('/', /*verificarToken, verificarRol(['Administrador']),*/ validarPaginacion, ctrl.listar);
router.get('/:id', /*verificarToken, verificarRol(['Administrador']),*/ ctrl.obtenerPorId);
router.post('/', /*verificarToken, verificarRol(['Administrador']),*/ ctrl.crear);
router.put('/:id', /*verificarToken, verificarRol(['Administrador']),*/ ctrl.actualizar);
router.patch('/:id/baja', /*verificarToken, verificarRol(['Administrador']),*/ ctrl.darDeBaja); // UC-11
router.post('/:id/regenerar-qr', /*verificarToken, verificarRol(['Administrador']),*/ ctrl.regenerarQr); // UC-12

module.exports = router;