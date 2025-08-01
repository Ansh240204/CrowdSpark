const express = require('express');
const router = express.Router();
const { signup, login } = require('./auth.controller');

// POST /api/auth/signup
router.post('/signup', signup);
router.post('/login', login);

module.exports = router;
