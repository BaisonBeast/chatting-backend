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
    const { email: emailInput, password } = req.body;
    const email = emailInput.toLowerCase();
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
    const { email: emailInput, password, username } = req.body;
    const email = emailInput.toLowerCase();
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

        // Create Demo User immediately
        const demoEmail = `demo_${email}`;
        const demoSalt = await bcrypt.genSalt(10);
        const demoHashedPassword = await bcrypt.hash("demo123", demoSalt);

        const demoUser = new ChatUser({
            email: demoEmail,
            password: demoHashedPassword,
            username: `Demo ${newUserName}`,
            profilePic: randomImage(),
            background: 1,
        });
        await demoUser.save();

        newUser.demoUser = demoUser._id;
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
    const { username, background, email: emailInput } = req.body;
    const email = emailInput.toLowerCase();

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

const getDemoUser = async (req: Request, res: Response) => {
    const { email: emailInput } = req.body;
    const email = emailInput.toLowerCase();
    try {
        const user = await ChatUser.findOne({ email });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_FOUND,
            });
        }

        let demoUser;
        if (user.demoUser) {
            demoUser = await ChatUser.findById(user.demoUser);
        }

        if (!demoUser) {
            // Create a new demo user
            const demoEmail = `demo_${user.email}`;
            // Check if demo user already exists by email (edge case)
            demoUser = await ChatUser.findOne({ email: demoEmail });

            if (!demoUser) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash("demo123", salt); // Default password for demo users

                demoUser = new ChatUser({
                    email: demoEmail,
                    password: hashedPassword,
                    username: `Demo ${user.username}`,
                    profilePic: randomImage(), // Helper from service
                    background: 1,
                });
                await demoUser.save();
            }

            // Link to main user
            user.demoUser = demoUser._id;
            await user.save();
        }

        const token = jwt.sign({ id: demoUser._id, email: demoUser.email }, process.env.JWT_SECRET || CONFIG.FALLBACK_SECRET, { expiresIn: CONFIG.TOKEN_EXPIRY as any });

        const dataToSend = {
            id: demoUser._id,
            email: demoUser.email,
            username: demoUser.username,
            profilePic: demoUser.profilePic,
            background: demoUser.background,
            token
        };

        return res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            data: dataToSend,
            message: "Demo user retrieved successfully",
        });

    } catch (error) {
        console.error("Error in getDemoUser:", error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

export { loginUser, registerUser, updateUser, getDemoUser };
