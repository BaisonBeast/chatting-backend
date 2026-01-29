import { Request, Response } from "express";
import { StatusCodes } from "src/enums/statusCodes.enum";
import { Status } from "src/enums/status.enum";
import ChatUser from "@models/ChatUserModel";
import Chat from "../models/ChatModel";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateNextWordPrompt, generateReplySuggestionPrompt } from "../utils/prompts";
import { MESSAGES, SOCKET_EVENTS, CONFIG } from "../utils/constants";

dotenv.config();

const getAllInvites = async (req: Request, res: Response) => {
    try {
        const email = req.user.email;
        const user = await ChatUser.findOne({ email });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_FOUND_EMAIL,
            });
        }
        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: MESSAGES.INVITE_LIST_FETCHED,
            data: user.inviteList,
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const getAllChats = async (req: Request, res: Response) => {
    try {
        const email = req.user.email;
        const user = await ChatUser.findOne({ email }).populate({
            path: "chatList",
            select: "-messages",
        });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_FOUND_EMAIL,
            });
        }

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: MESSAGES.CHAT_LIST_FETCHED,
            data: user.chatList,
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const createInvite = async (req: Request, res: Response) => {
    try {
        const senderEmail = req.user.email;
        const { recipientEmail: recipientEmailInput } = req.body;
        const recipientEmail = recipientEmailInput.toLowerCase();

        const senderUser = await ChatUser.findOne({ email: senderEmail }).populate(
            "inviteList"
        );
        if (!senderUser) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "Sender User not found with email: " + senderEmail,
            });
        }

        const recipientUser = await ChatUser.findOne({ email: recipientEmail });
        if (!recipientUser) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "Recipient User not found with email: " + recipientEmail,
            });
        }

        // Check if already friends
        const match = senderUser.friends.includes(recipientEmail);
        if (match) {
            return res.status(StatusCodes.CONFLICT).json({
                status: Status.FAILED,
                message: MESSAGES.USER_ALREADY_IN_CHAT,
            });
        }

        // Check if invite already sent (exists in RECIPIENT's list)
        const emailExistsInInvites = recipientUser.inviteList.some(
            (invite: any) => invite.email === senderEmail
        );

        if (emailExistsInInvites) {
            return res.status(StatusCodes.CONFLICT).json({
                status: Status.FAILED,
                message: MESSAGES.INVITE_EXISTS,
            });
        }

        // Check if the person we are inviting has already invited US (mutual)
        const hasReceivedInvite = senderUser.inviteList.some(
            (invite: any) => invite.email === recipientEmail
        );

        if (hasReceivedInvite) {
            return res.status(StatusCodes.CONFLICT).json({
                status: Status.FAILED,
                message: "This user has already invited you. Please check your invites.",
            });
        }

        const newInvite = {
            email: senderUser.email,
            username: senderUser.username,
            profilePic: senderUser.profilePic,
        };

        recipientUser.inviteList.push(newInvite);
        await recipientUser.save();

        req.io?.to(recipientEmail).emit(SOCKET_EVENTS.NEW_INVITE, newInvite);

        return res
            .status(StatusCodes.ACCEPTED)
            .json({ status: Status.SUCCESS, message: MESSAGES.INVITE_SENT });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const rejectInvite = async (req: Request, res: Response) => {
    try {
        const loggedUserEmail = req.user.email;
        const { newUserEmail: newUserEmailInput } = req.body;
        const newUserEmail = newUserEmailInput.toLowerCase();
        const user = await ChatUser.findOne({
            email: loggedUserEmail,
        }).populate("inviteList");
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_FOUND_EMAIL,
            });
        }
        user.inviteList.pull({ email: newUserEmail });
        await user.save();

        return res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: MESSAGES.INVITE_REMOVED,
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const acceptInvite = async (req: Request, res: Response) => {
    try {
        const loggedUserEmail = req.user.email;
        const { newUserEmail: newUserEmailInput } = req.body;
        const newUserEmail = newUserEmailInput.toLowerCase();
        const loggedUser = await ChatUser.findOne({
            email: loggedUserEmail,
        }).populate("inviteList");
        if (!loggedUser) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_EXIST,
            });
        }
        const newUser = await ChatUser.findOne({ email: newUserEmail });
        if (!newUser) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_EXIST,
            });
        }

        const participants = [
            {
                email: loggedUserEmail,
                username: loggedUser.username,
                profilePic: loggedUser.profilePic,
            },
            {
                email: newUserEmail,
                username: newUser.username,
                profilePic: newUser.profilePic,
            },
        ];

        const newChat = new Chat({
            participants,
        });
        await newChat.save();

        loggedUser.chatList.push(newChat._id);
        newUser.chatList.push(newChat._id);
        loggedUser.inviteList.pull({ email: newUserEmail });

        loggedUser.friends.push(newUserEmail);
        newUser.friends.push(loggedUserEmail);

        await loggedUser.save();
        await newUser.save();

        req.io
            ?.to(loggedUserEmail)
            .emit(SOCKET_EVENTS.CREATE_CHAT, {
                newChat,
                message: MESSAGES.USER_ADDED_TO_CHAT,
            });
        req.io
            ?.to(newUserEmail)
            .emit(SOCKET_EVENTS.CREATE_CHAT, {
                newChat,
                message: `${loggedUserEmail} has appected your invite`,
            });

        res.status(StatusCodes.CREATED).json({
            status: Status.SUCCESS,
            message: MESSAGES.USER_ADDED_TO_CHATLIST,
            data: participants,
        });
    } catch (error) {
        console.log(error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const deleteChat = async (req: Request, res: Response) => {
    const { chatId } = req.params;

    try {
        const loggedUserEmail = req.user.email;
        const { otherSideUserEmail: otherSideUserEmailInput } = req.body;
        const otherSideUserEmail = otherSideUserEmailInput.toLowerCase();
        const loggedUser = await ChatUser.findOne({ email: loggedUserEmail });
        const otherSideUser = await ChatUser.findOne({
            email: otherSideUserEmail,
        });

        if (!loggedUser || !otherSideUser) {
            return res
                .status(404)
                .json({ message: MESSAGES.USERS_NOT_FOUND });
        }

        loggedUser.chatList = loggedUser.chatList.filter(
            (id) => id.toString() !== chatId
        );
        otherSideUser.chatList = otherSideUser.chatList.filter(
            (id) => id.toString() !== chatId
        );

        loggedUser.friends = loggedUser.friends.filter(
            (email) => email !== otherSideUserEmail
        );
        otherSideUser.friends = otherSideUser.friends.filter(
            (email) => email !== loggedUserEmail
        );

        await loggedUser.save();
        await otherSideUser.save();

        const chat = await Chat.findByIdAndDelete(chatId);
        if (!chat) {
            return res.status(404).json({ message: MESSAGES.CHAT_NOT_FOUND });
        }

        req.io?.to(loggedUserEmail).emit(SOCKET_EVENTS.REMOVE_CHAT, {
            message: MESSAGES.REMOVED_CHAT,
            chatId
        });
        req.io?.to(otherSideUserEmail).emit(SOCKET_EVENTS.REMOVE_CHAT, {
            message: `${loggedUser.username} has removed the chat with you`,
            chatId,
        });

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: MESSAGES.CHAT_LIST_REMOVED,
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: "FAILED", message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const getSuggestion = async (req: Request, res: Response) => {
    try {
        const API_KEY = process.env.GEMINI_API_KEY;

        const { textContent } = req.query;
        const genAI = new GoogleGenerativeAI(API_KEY as string);
        const model = genAI.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });

        const prompt = generateNextWordPrompt(textContent as string);

        const result = await model.generateContent(prompt);

        // Check if result, response, and candidates are defined
        if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            res.status(200).json(
                result.response.candidates[0].content.parts[0].text
            );
        } else {
            res.status(500).json({
                status: "FAILED",
                message: MESSAGES.NO_SUGGESTIONS,
            });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: "FAILED", message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const getReplySuggestions = async (req: Request, res: Response) => {
    try {
        const API_KEY = process.env.GEMINI_API_KEY;
        const { textContent } = req.query;
        const genAI = new GoogleGenerativeAI(API_KEY as string);
        const model = genAI.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });

        const prompt = generateReplySuggestionPrompt(textContent as string);

        const result = await model.generateContent(prompt);

        if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            res.status(200).json(
                result.response.candidates[0].content.parts[0].text
            );
        } else {
            res.status(500).json({
                status: "FAILED",
                message: MESSAGES.NO_REPLY_SUGGESTIONS,
            });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: "FAILED", message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

export {
    getAllChats,
    acceptInvite,
    deleteChat,
    createInvite,
    getAllInvites,
    rejectInvite,
    getSuggestion,
    getReplySuggestions,
};
