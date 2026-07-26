const express = require('express');
const router = express.Router();
const { verificarToken, validarPaginacion } = require('../middleware/autorizacion');
const { verificarRol } = require('../middleware/rol');
const ctrl = require('../controllers/categoria.controller');

router.get('/', verificarToken, verificarRol(['Administrador']), validarPaginacion, ctrl.listar);
router.get('/:id', verificarToken, verificarRol(['Administrador']), ctrl.obtenerPorId);
router.post('/', verificarToken, verificarRol(['Administrador']), ctrl.crear);
router.put('/:id', verificarToken, verificarRol(['Administrador']), ctrl.actualizar);

module.exports = router;