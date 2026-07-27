const express = require('express');
const router = express.Router();
const { login } = require('../controllers/autorizacion.controller');

router.post('/login', login);

module.exports = router; 