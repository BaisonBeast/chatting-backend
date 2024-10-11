import { Request, Response } from "express";
import ChatUser from "../models/ChatUserModel";
import bcrypt from "bcrypt";
import { StatusCodes } from "src/enums/statusCodes.enum";
import { Status } from "src/enums/status.enum";
import {
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
            const dataToSend = {
                id: user._id,
                email: user.email,
                username: user.username,
                profilePic: user.profilePic,
                background: user.background
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
    const file = req.file as Express.Multer.File;
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
        const profilePictureUrl: string = await uploadImage(file);

        const newUser = new ChatUser({
            email: email,
            password: hashedPassword,
            username: newUserName,
            profilePic: profilePictureUrl,
        });

        await newUser.save();

        const dataToSend = {
            id: newUser._id,
            email: newUser.email,
            username: newUser.username,
            profilePic: newUser.profilePic,
            background: newUser.background
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

export { loginUser, registerUser };
