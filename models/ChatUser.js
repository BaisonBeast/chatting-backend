import mongoose from 'mongoose';

const ChatUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
},
  password: {
    type: String,
    required: true,
},
});

const ChatUser = mongoose.model('ChatUser', ChatUserSchema);

export default ChatUser;
export { ChatUserSchema };