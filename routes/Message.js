import express from 'express';
import Chat from '../models/Chat.js';

const router = express.Router();

// Get messages for a specific chat
router.get('/:chatId', async (req, res) => {
  const {chatId} = req.params;
  try {
    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    const message = {name: chat.chatName, messages: chat.messages}
    res.json(message);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Send a new message
router.post('/newMessage', async (req, res) => {
  const { chatId, senderName, message } = req.body;

  try {
    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.messages.push({ senderName, message });
    chat.chatTime = Date.now();
    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

export default router;
