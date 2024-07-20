import connectDB from "./config/db.js";
import express from "express";
import dotenv from "dotenv";
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import MessageRoutes from './routes/Message.js';
import ChatRoutes from './routes/Chat.js';


dotenv.config();
connectDB();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/messages', MessageRoutes);
app.use('/api/chat', ChatRoutes);

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

io.engine.on("connection_error", (err) => {
  console.log(err.req);      // the request object
  console.log(err.code);     // the error code, for example 1
  console.log(err.message);  // the error message, for example "Session ID unknown"
  console.log(err.context);  // some additional error context
});

app.get('/', function(req, res) {
  res.send('Hello')
})

server.listen(PORT, () => {
    console.log(
        `Server Running on port ${PORT}`
    );
});