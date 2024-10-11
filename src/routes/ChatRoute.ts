import express from "express";
import {
    getAllChats,
    acceptInvite,
    deleteChat,
    createInvite,
    getAllInvites,
    rejectInvite
} from "../controllers/ChatController";

const router = express.Router();

// Get all chats
router.get("/getAllChats", getAllChats);

//Get all invites
router.get("/getAllInvites", getAllInvites);

// Create a new chat
router.post("/acceptInvite", acceptInvite);

// Create a new chat
router.post("/rejectInvite", rejectInvite);

// Create a new invite
router.post("/inviteUser", createInvite);

// Delete a existing chat
router.delete("/deleteChat", deleteChat);

export default router;
