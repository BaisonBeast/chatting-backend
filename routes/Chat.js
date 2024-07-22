import express from 'express';
import Chat from '../models/Chat.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all chats
router.get('/getAllChats', async (req, res) => {
  try {
    const chats = await Chat.find().select('-messages'); 
    res.json(chats);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Create a new Chat
router.post('/createChat', async (req, res) => {
  const { chatName } = req.body;
  const chatId = uuidv4();
  const chatTime = Date.now();

  try {
    const newChat = new Chat({
      chatId, 
      chatName,
      chatTime,
      messages: []
    });

    const chat = await newChat.save();
    res.status(201).json({  chatId, chatName, chatTime});
    req.io.emit('cratedChat', { chatId, chatName, chatTime })
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.delete('/deleteChat/:chatId', async (req, res) => {
  const { chatId } = req.params;
  try {
    const chat = await Chat.findOneAndDelete({ chatId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

export default router;
