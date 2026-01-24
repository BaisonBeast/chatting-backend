import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
    loginUser,
    registerUser,
    updateUser,
} from "../controllers/ChatUserController";
import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const router = express.Router();

router.post("/login", loginUser);

router.post(
    "/register",
    upload.single("profilePic"),
    (req, res, next) => {
        if (!req.file) {
            req.file = undefined;
        }
        next();
    },
    registerUser
);

router.post(
    "/update",
    authMiddleware,
    upload.single("profilePic"),
    (req, res, next) => {
        if (!req.file) {
            req.file = undefined;
        }
        next();
    },
    updateUser
);

export default router;
