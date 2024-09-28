import express from "express";
import {
    getAllChats,
    acceptInvite,
    deleteChat,
    createInvite,
} from "../controllers/ChatController";

const router = express.Router();

// Get all chats
router.get("/getAllChats", getAllChats);

// Create a new chat
router.post("/createNewChat", acceptInvite);

router.post("/inviteUser", createInvite);

// Delete a existing chat
router.delete("/deleteChat", deleteChat);

export default router;
