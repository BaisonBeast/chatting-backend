import express from "express";
import {
    loginUser,
    registerUser,
    updateUser,
} from "../controllers/ChatUserController";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

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
