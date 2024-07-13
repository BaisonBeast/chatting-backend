import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// Get messages for a specific chat
router.get('/:chatId', async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort('timestamp');
    res.json(messages);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Send a new message
router.post('/', async (req, res) => {
  const { chatId, senderId, content } = req.body;

  try {
    const newMessage = new Message({
      chatId,
      senderId,
      content,
    });

    const message = await newMessage.save();
    res.json(message);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

export default router;
