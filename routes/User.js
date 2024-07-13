import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const salt = await bcrypt.genSalt(10);

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password field
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Create a new user (for testing purposes)
router.post('/', async (req, res) => {
  const { username, email, password } = req.body;
  const newPass = await bcrypt.hash(password, salt);
    
  try {
    let presentUser = await User.findOne({ email });
    if (presentUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new User({
      username,
      email,
      password: newPass,
    });

    const user = await newUser.save();
    res.status(201).json({ username });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// User login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      res.json({ username: user.username});
    } catch (err) {
      res.status(500).send('Server Error');
    }
  });

export default router;
