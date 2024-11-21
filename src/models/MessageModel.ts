import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
    {
        senderEmail: {
            type: String,
            required: true,
        },
        messageType: {
            type: String,
            default: 'text',
            required: true,
        },
        message: {
            type: String,
            required: true
        },
        like: {
            type: [String],
            default: [],
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
