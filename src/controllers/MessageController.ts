import { Request, Response } from "express";
import Chat from "../models/ChatModel.js";
import Message from "../models/MessageModel";
import { StatusCodes } from "src/enums/statusCodes.enum.js";
import { Status } from "src/enums/status.enum.js";
import { uploadFile } from "../services/messageService.js";
import { MESSAGES, SOCKET_EVENTS } from "../utils/constants";

import Group from "../models/GroupModel";

const getAllMessages = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    try {
        let chat: any = await Chat.findOne({ _id: chatId }).populate("messages");
        if (!chat) {
            chat = await Group.findOne({ _id: chatId }).populate("messages");
        }

        if (!chat) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_EXIST,
            });
        }
        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: MESSAGES.ALL_MESSAGES_FETCHED,
            data: chat.messages,
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const createNewMessage = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    try {
        const { message, messageType } = req.body; // otherSideUser may not be needed or relevant for groups
        const loggedInUser = req.user.email;
        console.log(req.body);

        const file = (req.file as Express.Multer.File) ?? null;

        let chat: any = await Chat.findOne({ _id: chatId });
        let isGroup = false;

        if (!chat) {
            chat = await Group.findOne({ _id: chatId });
            isGroup = !!chat;
        }

        if (!chat) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_EXIST,
            });
        }

        let messageToBeSaved;
        if (file) {
            try {
                messageToBeSaved = await uploadFile(file);
            } catch (error) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    status: Status.FAILED,
                    message: MESSAGES.FILE_UPLOAD_FAILED,
                });
            }
        } else {
            messageToBeSaved = message;
        }

        const newMessage = new Message({
            senderEmail: loggedInUser,
            message: messageToBeSaved,
            messageType,
        });

        await newMessage.save();

        chat.messages.push(newMessage._id);
        await chat.save();

        // Emit to all participants
        // For Chat (1-on-1): participants has 2 users.
        // For Group: participants has N users.
        chat.participants.forEach((participant: any) => {
            req.io?.to(participant.email).emit(SOCKET_EVENTS.NEW_MESSAGE, {
                message: newMessage,
                chatId // Return chatId so frontend knows where to place it
            });
        });

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: MESSAGES.MESSAGE_SENT,
            data: newMessage,
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const deleteMessage = async (req: Request, res: Response) => {
    const { messageId } = req.params;
    try {
        const { otherSideUserEmail } = req.body;
        const loggedUserEmail = req.user.email;

        console.log(req.params);
        console.log(req.body);
        const message = await Message.findOne({ _id: messageId });
        if (!message) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.MESSAGE_NOT_FOUND,
            });
        }

        message.message = MESSAGES.MESSAGE_DELETED_CONTENT;
        message.isDeleted = true;

        await message.save();

        req.io?.to(loggedUserEmail).emit(SOCKET_EVENTS.DELETE_MESSAGE, {
            messageId,
        });
        req.io?.to(otherSideUserEmail).emit(SOCKET_EVENTS.DELETE_MESSAGE, {
            messageId,
        });

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: "Message deleted successfully",
        });

    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const updateMessage = async (req: Request, res: Response) => {
    try {
        const { messageId, otherSideUserEmail, newMessage } = req.body;
        const loggedUserEmail = req.user.email;
        const message = await Message.findOne({ _id: messageId });
        if (!message) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.MESSAGE_NOT_FOUND,
            });
        }

        message.message = newMessage;
        message.isEdited = true;

        await message.save();

        req.io?.to(loggedUserEmail).emit(SOCKET_EVENTS.MESSAGE_EDITED, {
            messageId,
            newMessage
        });
        req.io?.to(otherSideUserEmail).emit(SOCKET_EVENTS.MESSAGE_EDITED, {
            messageId,
            newMessage
        });

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: MESSAGES.UPDATED,
            data: message,
        });
    } catch (err: any) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const likeMessage = async (req: Request, res: Response) => {
    try {
        const { messageId, otherSideUserEmail } = req.body;
        const likeGivenUserEmail = req.user.email;
        const message = await Message.findOne({ _id: messageId });
        if (!message) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.MESSAGE_NOT_FOUND, // Assuming small casing difference is fine to unify
            });
        }
        if (message.like.includes(likeGivenUserEmail)) {
            return res.status(StatusCodes.CONFLICT).json({
                status: Status.FAILED,
                message: MESSAGES.CANNOT_LIKE_TWICE,
            });
        }
        message.like.push(likeGivenUserEmail);
        await message.save();
        req.io?.to(likeGivenUserEmail).emit(SOCKET_EVENTS.LIKE_MESSAGE, {
            messageId,
            email: likeGivenUserEmail,
        });
        req.io?.to(otherSideUserEmail).emit(SOCKET_EVENTS.LIKE_MESSAGE, {
            messageId,
            email: likeGivenUserEmail,
        });

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: "Message liked successfully",
        });
    } catch (error) {
        console.log(error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
}

export { getAllMessages, deleteMessage, createNewMessage, updateMessage, likeMessage };
