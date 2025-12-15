const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// [cite: 34]
router.post('/signup', authController.signup);

// [cite: 41]
router.post('/login', authController.login);

module.exports = router;