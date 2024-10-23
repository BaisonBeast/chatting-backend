import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
    {
        senderName: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        like: {
            type: Number,
            default: 0,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);

export default Message;
export { MessageSchema };
