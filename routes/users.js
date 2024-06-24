const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Generate JWT token
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');
console.log(secret);

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token not provided' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Add userId to request object
    next(); // Proceed to next middleware
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Registration endpoint
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    // Respond with success message
    return res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error registering user:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expiration time
    });

    // Return the token as a response
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).send('Internal server error');
  }
});

// Endpoint to check if user is registered 
router.get('/checkRegistered', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      res.status(200).json({ registered: true });
    } else {
      res.status(404).json({ registered: false });
    }
  } catch (error) {
    console.error('Error checking registration:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token not provided' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Add userId to request object
    next(); // Proceed to next middleware
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Example endpoint to refresh token
router.post('/refreshToken', async (req, res) => {
  const refreshToken = req.headers.authorization.split(' ')[1]; // Assuming refreshToken is passed in headers

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const userId = decoded.userId;

    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token: accessToken, expiresIn: 3600 }); // Return new token and expiration
  } catch (error) {
    console.error('Error refreshing token:', error.message);
    res.status(401).json({ error: 'Unauthorized: Invalid refresh token' });
  }
});

module.exports = router;
