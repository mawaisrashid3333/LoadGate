/**
 * Auth Routes
 * Authentication endpoints
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Login endpoint
router.post('/login', AuthController.login);

// Verify token endpoint
router.get('/verify', AuthController.verify);

module.exports = router;
