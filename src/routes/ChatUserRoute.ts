import express from "express";
import { loginUser, registerUser } from "../controllers/ChatUserController";
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post("/login", loginUser);

router.post("/register", upload.single('profilePic'), registerUser);

export default router;