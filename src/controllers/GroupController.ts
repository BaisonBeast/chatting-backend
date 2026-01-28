import { Request, Response } from "express";
import { StatusCodes } from "src/enums/statusCodes.enum";
import { Status } from "src/enums/status.enum";
import ChatUser from "@models/ChatUserModel";
import Group from "../models/GroupModel";
import { MESSAGES, SOCKET_EVENTS } from "../utils/constants";
import mongoose from "mongoose";

const createGroup = async (req: Request, res: Response) => {
    try {
        const loggedUserEmail = req.user.email;
        const { groupName, groupIcon, participants } = req.body; // participants is array of emails

        const adminUser = await ChatUser.findOne({ email: loggedUserEmail });
        if (!adminUser) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_FOUND_EMAIL,
            });
        }

        // Validate participants
        const participantUsers = await ChatUser.find({ email: { $in: participants } });

        // Prepare participant objects for Group Schema
        const groupParticipants = [
            {
                email: adminUser.email,
                username: adminUser.username,
                profilePic: adminUser.profilePic
            },
            ...participantUsers.map(u => ({
                email: u.email,
                username: u.username,
                profilePic: u.profilePic
            }))
        ];

        const newGroup = new Group({
            groupName,
            groupIcon,
            admin: adminUser._id,
            participants: groupParticipants
        });

        await newGroup.save();

        // Update user's group lists
        const allMemberIds = [adminUser._id, ...participantUsers.map(u => u._id)];

        await ChatUser.updateMany(
            { _id: { $in: allMemberIds } },
            { $push: { groupList: newGroup._id } }
        );

        // Notify all members via Socket
        // Notify all members via Socket
        [adminUser.email, ...participants].forEach(email => {
            req.io?.to(email).emit("createGroup", {
                newChat: newGroup,
                isGroup: true,
                message: `You were added to group ${groupName}`
            });
        });

        res.status(StatusCodes.CREATED).json({
            status: Status.SUCCESS,
            message: "Group created successfully",
            data: newGroup
        });

    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const getAllGroups = async (req: Request, res: Response) => {
    try {
        const email = req.user.email;
        const user = await ChatUser.findOne({ email }).populate("groupList");

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: Status.FAILED,
                message: MESSAGES.USER_NOT_FOUND_EMAIL,
            });
        }

        res.status(StatusCodes.OK).json({
            status: Status.SUCCESS,
            message: "Groups fetched successfully",
            data: user.groupList,
        });
    } catch (err) {
        console.log(err);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ status: Status.FAILED, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

export { createGroup, getAllGroups };
