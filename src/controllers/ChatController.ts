import { Request, Response } from "express";
import { StatusCodes } from "src/enums/statusCodes.enum";
import { Status } from "src/enums/status.enum";
import ChatUser from "@models/ChatUserModel";
import Chat from "../models/ChatModel";
import dotenv from "dotenv";
import {GoogleGenerativeAI} from "@google/generative-ai";

dotenv.config();

const getAllInvites = async (req: Request, res: Response) => {
    const { email } = req.query;
    try {
        const user = await ChatUser.findOne({ email });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "User not Exist with this email..",
            });
        }
        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: "All invitelist fetched",
            data: user.inviteList,
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
    }
};

const getAllChats = async (req: Request, res: Response) => {
    const { email } = req.query;
    try {
        const user = await ChatUser.findOne({ email }).populate({
            path: "chatList",
            select: "-messages",
        });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "User not Exist with this email..",
            });
        }

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: "All chatList fetched",
            data: user.chatList,
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
    }
};

const createInvite = async (req: Request, res: Response) => {
    const { invitedEmail, inviteeEmail, inviteeUsername, inviteeProfilePic } =
        req.body;
    try {
        const user = await ChatUser.findOne({ email: invitedEmail }).populate(
            "inviteList"
        );
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "User not Exist with this email..",
            });
        }
        const invitedUser = await ChatUser.findOne({ email: inviteeEmail });
        if (!invitedUser) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "User not Exist with this email..",
            });
        }

        const match = user.friends.includes(inviteeEmail);
        if (match) {
            return res.status(StatusCodes.CONFLICT).json({
                status: Status.FAILED,
                message: "User already added in the chat-list",
            });
        }

        const emailExistsInInvites = user.inviteList.some(
            (invite: any) => invite.email === inviteeEmail
        );

        if (emailExistsInInvites) {
            return res.status(StatusCodes.CONFLICT).json({
                status: Status.FAILED,
                message: "Invite already exists for this email.",
            });
        }

        const newInvite = {
            email: inviteeEmail,
            username: inviteeUsername,
            profilePic: inviteeProfilePic,
        };

        user.inviteList.push(newInvite);
        await user.save();

        req.io?.to(invitedEmail).emit("newInvite", newInvite);

        return res
            .status(StatusCodes.ACCEPTED)
            .json({ status: Status.SUCCESS, message: "Invite sent" });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
    }
};

const rejectInvite = async (req: Request, res: Response) => {
    const { loggedUserEmail, newUserEmail } = req.body;
    try {
        const user = await ChatUser.findOne({
            email: loggedUserEmail,
        }).populate("inviteList");
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "User not Exist with this email..",
            });
        }
        user.inviteList.pull({ email: newUserEmail });
        await user.save();

        return res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: "Invite removed successfully",
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
    }
};

const acceptInvite = async (req: Request, res: Response) => {
    const { loggedUserEmail, newUserEmail } = req.body;
    try {
        const loggedUser = await ChatUser.findOne({
            email: loggedUserEmail,
        }).populate("inviteList");
        if (!loggedUser) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "User not Exist",
            });
        }
        const newUser = await ChatUser.findOne({ email: newUserEmail });
        if (!newUser) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "User not Exist",
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

        req.io?.to(loggedUserEmail).emit("createChat", {newChat, message: 'User added to your chatList'});
        req.io?.to(newUserEmail).emit("createChat", {newChat, message: `${loggedUserEmail} has appected your invite`});

        res.status(StatusCodes.CREATED).json({
            status: Status.SUCCESS,
            message: "User added to the chatlist",
            data: participants,
        });
    } catch (error) {
        console.log(error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
    }
};

const deleteChat = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { loggedUserEmail, otherSideUserEmail } = req.body;

    try {
        const loggedUser = await ChatUser.findOne({ email: loggedUserEmail });
        const otherSideUser = await ChatUser.findOne({
            email: otherSideUserEmail,
        });

        if (!loggedUser || !otherSideUser) {
            return res
                .status(404)
                .json({ message: "One or both users not found" });
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
            return res.status(404).json({ message: "Chat not found" });
        }

        req.io?.to(loggedUserEmail).emit("removeChat", {
            message: 'Removed chat',
            chatId
        });
        req.io?.to(otherSideUserEmail).emit("removeChat", {
            message: `${loggedUser.username} has removed the chat with you`,
            chatId
        });

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: "ChatList removed",
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: "FAILED", message: "Something Went Wrong" });
    }
};

const getSuggestion = async (req: Request, res: Response) => {
    try {
        const API_KEY = process.env.GEMNI_API_KEY;
        const { textContent } = req.query;
        const genAI = new GoogleGenerativeAI(API_KEY as string);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are building a chat application and want to provide 5 short, relevant autocomplete suggestions based on the user's input. The user has typed the following text: "${textContent}". Provide 5 brief and relevant autocomplete suggestions in the following format:

Suggestion 1, Suggestion 2, Suggestion 3, Suggestion 4, Suggestion 5

Ensure that the suggestions are short and relevant. Do not include any other text or explanation, just the comma-separated suggestions.`;


        const result = await model.generateContent(prompt);

        // Check if result, response, and candidates are defined
        if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            res.status(200).json(result.response.candidates[0].content.parts[0].text);
        } else {
            res.status(500).json({ status: "FAILED", message: "No suggestions returned from API" });
        }

    } catch (error) {
        console.log(error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: "FAILED", message: "Something Went Wrong" });
    }
}

const getReplySuggestions = async (req: Request, res: Response) => {
    try {
        const API_KEY = process.env.GEMNI_API_KEY;
        const { textContent } = req.query; 
        const genAI = new GoogleGenerativeAI(API_KEY as string);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are building a chat application and want to provide 5 short, concise reply suggestions based on the user's input. The user has typed the following text: "${textContent}". Provide 5 brief and relevant reply suggestions in the following format:

Reply 1, Reply 2, Reply 3, Reply 4, Reply 5

Ensure that the replies are short and to the point. Do not include any other text or explanation, just the comma-separated suggestions.`;


        const result = await model.generateContent(prompt);

        if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            res.status(200).json(result.response.candidates[0].content.parts[0].text);
        } else {
            res.status(500).json({ status: "FAILED", message: "No reply suggestions returned from API" });
        }

    } catch (error) {
        console.log(error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: "FAILED", message: "Something Went Wrong" });
    }
}



export {
    getAllChats,
    acceptInvite,
    deleteChat,
    createInvite,
    getAllInvites,
    rejectInvite,
    getSuggestion,
    getReplySuggestions
};
