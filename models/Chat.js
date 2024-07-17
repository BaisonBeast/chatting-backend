import mongoose from 'mongoose';
import {MessageSchema} from './Message.js';

const ChatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
  },
  chatName: {
    type: String,
    required: true
  },
  chatTime: {
    type: Date,
  },
  messages: [MessageSchema],
});

const Chat = mongoose.model('Chat', ChatSchema);

export default Chat;
