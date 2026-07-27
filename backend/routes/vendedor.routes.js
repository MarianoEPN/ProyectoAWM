const express = require('express');
const router = express.Router();
const { verificarToken, validarPaginacion } = require('../middleware/autorizacion');
const { verificarRol } = require('../middleware/rol');
const upload = require('../middleware/subirImagen');
const ctrl = require('../controllers/vendedor.controller');


router.get('/validar', /* verificarToken, verificarRol(['Validador', 'Administrador']),*/ ctrl.validarAcceso);
router.get('/', /*verificarToken, verificarRol(['Administrador']),*/ validarPaginacion, ctrl.listar);
router.get('/:id', /* verificarToken, verificarRol(['Administrador']),*/ ctrl.obtenerPorId);
router.post('/',/* verificarToken, verificarRol(['Administrador']),*/ upload.single('foto'), ctrl.crear);
router.put('/:id',/* verificarToken, verificarRol(['Administrador']),*/upload.single('foto'), ctrl.actualizar);
router.patch('/:id/baja', /*verificarToken, verificarRol(['Administrador']),*/ ctrl.darDeBaja); // UC-03
router.post('/:id/regenerar-qr',/* verificarToken, verificarRol(['Administrador']),*/ ctrl.regenerarQr); // UC-04

module.exports = router;