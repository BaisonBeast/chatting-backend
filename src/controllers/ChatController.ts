import { Request, Response } from "express";
import { StatusCodes } from "src/enums/statusCodes.enum";
import { Status } from "src/enums/status.enum";
import ChatUser from "@models/ChatUserModel";
import Chat from "../models/ChatModel";

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

export {
    getAllChats,
    acceptInvite,
    deleteChat,
    createInvite,
    getAllInvites,
    rejectInvite,
};
