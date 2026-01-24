import express from "express";
import {
    getAllMessages,
    deleteMessage,
    createNewMessage,
    updateMessage,
    likeMessage
} from "../controllers/MessageController";
import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const router = express.Router();

// Get messages for a specific chat
router.get("/allMessage/:chatId", getAllMessages);

//Delete message
router.delete("/delete/:messageId", deleteMessage);

//Edit message
router.put("/update/:messageId", updateMessage);

//Like message
router.post('/likeMessage', likeMessage);

// create a new message
router.post(
    "/newMessage/:chatId",
    upload.single("messageFile"),
    (req, res, next) => {
        if (!req.file) {
            req.file = undefined;
        }
        next();
    },
    createNewMessage
);

export default router;
