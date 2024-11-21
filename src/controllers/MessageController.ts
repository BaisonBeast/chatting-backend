import { Request, Response } from "express";
import Chat from "../models/ChatModel.js";
import Message from "../models/MessageModel";
import { StatusCodes } from "src/enums/statusCodes.enum.js";
import { Status } from "src/enums/status.enum.js";
import {
    uploadFile
} from '../services/messageService.js';

const getAllMessages = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    try {
        const chat = await Chat.findOne({ _id: chatId }).populate("messages");
        if (!chat) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "User not Exist",
            });
        }
        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: "All messages fetched",
            data: chat.messages,
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
    }
};

const createNewMessage = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { message, messageType, loggedInUser, otherSideUser } = req.body;
    const file = req.file as Express.Multer.File ?? null;
    try {
        const chat = await Chat.findOne({ _id: chatId });
        if (!chat) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "User not Exist",
            });
        }

        let messageToBeSaved;
        if(file)
            messageToBeSaved = await uploadFile(file);
        else messageToBeSaved = message;

        const newMessage = new Message({
            senderEmail: loggedInUser,
            message: messageToBeSaved,
            messageType
        });

        await newMessage.save();

        chat.messages.push(newMessage._id);
        await chat.save();

        console.log(newMessage)

        req.io?.to(loggedInUser).emit("newMessage", {
            message: newMessage,
        });
        req.io?.to(otherSideUser).emit("newMessage", {
            message: newMessage,
        });

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: "Message Sent",
            data: newMessage,
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
    }
};

const deleteMessage = async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const {loggedUserEmail, otherSideUserEmail} = req.body;

    try {
        const message = await Message.findOne({ _id: messageId });
        if (!message) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "Message not Found",
            });
        }

        message.message = "";
        message.isDeleted = true;

        await message.save();

        req.io?.to(loggedUserEmail).emit("deleteMessage", {
            messageId
        });
        req.io?.to(otherSideUserEmail).emit("deleteMessage", {
            messageId
        });

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: "Message deleted successfully",
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
    }
};

const updateMessage = async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const { newMessage } = req.params;
    try {
        const message = await Message.findOne({ _id: messageId });
        if (!message) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "Message not Found",
            });
        }

        message.message = newMessage;
        message.isEdited = true;

        await message.save();

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: "Message successfully updated..",
        });
    } catch (err: any) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
    }
};

export { getAllMessages, deleteMessage, createNewMessage, updateMessage };
