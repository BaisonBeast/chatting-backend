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

const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user = await ChatUser.findOne({ email });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "USER NOT FOUND!!",
            });
        } else {
            const match = await bcrypt.compare(password, user.password);
            if (!match)
                return res.status(StatusCodes.UNAUTHORIZED).send({
                    status: Status.FAILED,
                    message: "Password does not match!!",
                });
            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "fallbacksecret", { expiresIn: "1d" });

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
                message: "Successfully Logged In!!",
            });
        }
    } catch (error) {
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
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
                message: "User Already exist with this email",
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

        const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET || "fallbacksecret", { expiresIn: "1d" });

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
                message: "User Successfully Registerd!!",
            });
    } catch (error) {
        console.log(error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
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
                message: "User not found with this email",
            });
        }
        if (file) {
            const profilePictureUrl: string = await uploadImage(file);
            user.profilePic = profilePictureUrl;
        }

        if (username !== '' && user.username !== username) user.username = username;
        if (user.background != background) user.background = background;

        await user.save();

        const dataToSend = {
            id: user._id,
            email: user.email,
            username: user.username,
            profilePic: user.profilePic,
            background: user.background
        };

        return res
            .status(StatusCodes.OK)
            .json({
                status: Status.SUCCESS,
                data: dataToSend,
                message: "User Successfully Updated!!",
            });

    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
    }
}

export { loginUser, registerUser, updateUser };
