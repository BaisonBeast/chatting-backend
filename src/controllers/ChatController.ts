import { Request, Response } from "express";
import { StatusCodes } from "src/enums/statusCodes.enum";
import { Status } from "src/enums/status.enum";
import ChatUser from "@models/ChatUserModel";
import Chat from "../models/ChatModel";

const getAllChats = async (req: Request, res: Response) => {
    const { email } = req.body;
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

const acceptInvite = async (req: Request, res: Response) => {
    const { loggedUserEmail, newUserEmail } = req.body;
    try {
        const loggedUser = await ChatUser.findOne({ email: loggedUserEmail });
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
                username: loggedUser.username,
                profilePic: loggedUser.profilePic,
            },
            {
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

        await loggedUser.save();
        await newUser.save();

        res.status(StatusCodes.CREATED).json({
            status: Status.SUCCESS,
            message: "Successfully Created",
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
    try {
        const chat = await Chat.findOneAndDelete({ chatId });
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        res.status(200).json({
            message: "Chat and associated messages deleted successfully",
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: "Something Went Wrong" });
    }
};

export { getAllChats, acceptInvite, deleteChat, createInvite };
