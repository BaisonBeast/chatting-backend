import express from "express";
import {
    getAllChats,
    acceptInvite,
    deleteChat,
    createInvite,
    getAllInvites,
    rejectInvite,
    getSuggestion,
    getReplySuggestions
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
router.delete("/deleteChat/:chatId", deleteChat);
//Chat autocompletion
router.get('/chatSuggestion', getSuggestion);
//Chat reply
router.get('/replySuggestion', getReplySuggestions);

export default router;
