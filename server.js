import connectDB from "./config/db.js";
import express from "express";
import dotenv from "dotenv";
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import MessageRoutes from './routes/Message.js';


const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/messages', MessageRoutes);
app.use('/api/users', userRoutes);

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on('sendMessage', (message) => {
    io.to(message.chatId).emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

//run listen
app.listen(PORT, () => {
    console.log(
        `Server Running on port ${PORT}`
    );
});


