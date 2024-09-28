import express from "express";
import {
    getAllMessages,
    deleteMessage,
    createNewMessage,
} from "../controllers/MessageController";

const router = express.Router();

// Get messages for a specific chat
router.get("/allMessage/:chatId", getAllMessages);

//Delete message
router.delete("/delete", deleteMessage);

// create a new message
router.post("/newMessage/:chatId", createNewMessage);

export default router;
