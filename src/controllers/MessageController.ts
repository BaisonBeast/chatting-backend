import { Request, Response } from "express";
import Chat from "../models/ChatModel.js";
import Message from "../models/MessageModel";
import { StatusCodes } from "src/enums/statusCodes.enum.js";
import { Status } from "src/enums/status.enum.js";

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
    const { message, senderName } = req.body;
    try {
        const chat = await Chat.findOne({ _id: chatId });
        if (!chat) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "User not Exist",
            });
        }
        const newMessage = new Message({
            senderName,
            message,
        });

        await newMessage.save();

        chat.messages.push(newMessage._id);
        await chat.save();

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
    try {
        const message = await Message.findOne({ _id: messageId });
        if (!message) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: "Message not Found",
            });
        }

        message.isDeleted = true;

        await message.save();

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

// const createNewMessage = async (req: Request, res: Response) => {
//     const { chatId, senderName, message } = req.body;
//     try {
//         // Find the chat by chatId
//         const chat = await Chat.findOne({ chatId });
//         if (!chat) {
//             return res.status(404).json({ message: "Chat not found" });
//         }

//         // Create a new message
//         const newMessage = new Message({
//             senderName,
//             message,
//         });

//         // Save the message to the database
//         await newMessage.save();

//         // Add the new message's ObjectId to the chat's messages array
//         chat.messages.push(newMessage._id);
//         chat.chatTime = new Date(); // Update chat's last activity time
//         await chat.save();

//         // Emit the new message to all connected clients in the chat room
//         if (req.io) req.io.to(chatId).emit("receiveMessage", newMessage);

//         // Send response to the client
//         res.status(201).json({
//             message: "Message sent successfully",
//             newMessage,
//         });
//     } catch (err) {
//         console.error("Error:", err);
//         res.status(500).send("Server Error");
//     }
// };

export { getAllMessages, deleteMessage, createNewMessage };
