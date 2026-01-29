import mongoose from "mongoose";

const InviteSchema = new mongoose.Schema({
    email: {
        type: String
    },
    username: {
        type: String
    },
    profilePic: {
        type: String
    }
});

const ChatUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
        required: true,
    },
    background: {
        type: Number,
        default: 1,
    },
    friends: [{
        type: String,
        default: [],
    }],
    chatList: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            default: [],
        },
    ],
    groupList: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            default: [],
        },
    ],
    inviteList: [
        {
            type: InviteSchema,
            default: [],
        },
    ],
    demoUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatUser",
        default: null,
    },
});

const ChatUser = mongoose.model("ChatUser", ChatUserSchema);

export default ChatUser;
export { ChatUserSchema };
