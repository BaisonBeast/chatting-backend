import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import ChatUser from "../models/ChatUserModel";
import bcrypt from "bcrypt";
import { StatusCodes } from "src/enums/statusCodes.enum";
import { Status } from "src/enums/status.enum";
import {
    randomImage,
    randomNameGenerator,
    uploadImage,
} from "src/services/ChatUserRouteService";
import { MESSAGES, CONFIG } from "../utils/constants";

const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user = await ChatUser.findOne({ email });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_FOUND,
            });
        } else {
            const match = await bcrypt.compare(password, user.password);
            if (!match)
                return res.status(StatusCodes.UNAUTHORIZED).send({
                    status: Status.FAILED,
                    message: MESSAGES.PASSWORD_MISMATCH,
                });
            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || CONFIG.FALLBACK_SECRET, { expiresIn: CONFIG.TOKEN_EXPIRY as any });

            const dataToSend = {
                id: user._id,
                email: user.email,
                username: user.username,
                profilePic: user.profilePic,
                background: user.background,
                token
            };
            return res.status(StatusCodes.ACCEPTED).json({
                status: Status.SUCCESS,
                data: dataToSend,
                message: MESSAGES.LOGGED_IN,
            });
        }
    } catch (error) {
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const registerUser = async (req: Request, res: Response) => {
    const { email, password, username } = req.body;
    const file = req.file as Express.Multer.File ?? null;
    try {
        const user = await ChatUser.findOne({ email });
        if (user) {
            return res.status(StatusCodes.CONFLICT).json({
                status: Status.FAILED,
                message: MESSAGES.USER_EXISTS_EMAIL,
            });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUserName: string = randomNameGenerator(username);
        let profilePictureUrl: string;
        if (file)
            profilePictureUrl = await uploadImage(file);
        else
            profilePictureUrl = randomImage();

        const newUser = new ChatUser({
            email: email,
            password: hashedPassword,
            username: newUserName,
            profilePic: profilePictureUrl,
        });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET || CONFIG.FALLBACK_SECRET, { expiresIn: CONFIG.TOKEN_EXPIRY as any });

        const dataToSend = {
            id: newUser._id,
            email: newUser.email,
            username: newUser.username,
            profilePic: newUser.profilePic,
            background: newUser.background,
            token
        };

        return res
            .status(StatusCodes.CREATED)
            .json({
                status: Status.SUCCESS,
                data: dataToSend,
                message: MESSAGES.REGISTERED,
            });
    } catch (error) {
        console.log(error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const updateUser = async (req: Request, res: Response) => {
    const { username, background, email } = req.body;

    const file = req.file as Express.Multer.File ?? null;
    try {
        const user = await ChatUser.findOne({ email });
        if (!user) {
            return res.status(StatusCodes.CONFLICT).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_FOUND_CONFLICT,
            });
        }
        if (file) {
            const profilePictureUrl: string = await uploadImage(file);
            user.profilePic = profilePictureUrl;
        }

        if (username !== '' && user.username !== username) user.username = username;
        if (user.background != background) user.background = background;

        await user.save();

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || CONFIG.FALLBACK_SECRET, { expiresIn: CONFIG.TOKEN_EXPIRY as any });

        const dataToSend = {
            id: user._id,
            email: user.email,
            username: user.username,
            profilePic: user.profilePic,
            background: user.background,
            token
        };

        return res
            .status(StatusCodes.OK)
            .json({
                status: Status.SUCCESS,
                data: dataToSend,
                message: MESSAGES.UPDATED,
            });

    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

export { loginUser, registerUser, updateUser };
