import mongoose, { CallbackError } from "mongoose";
import Message from "./MessageModel";

const ParticipantSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        profilePic: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const ChatSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: ParticipantSchema,
                required: true,
            },
        ],
        messages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message",
                default: [],
            },
        ],
    },
    { timestamps: true }
);

ChatSchema.pre(
    "findOneAndDelete",
    async function (next: (err?: CallbackError) => void) {
        try {
            const chat = await this.model.findOne(this.getFilter());
            if (chat && chat.messages.length > 0) {
                await Message.deleteMany({ _id: { $in: chat.messages } });
            }
            next();
        } catch (error) {
            next(error as CallbackError);
        }
    }
);

const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;
export { ChatSchema };
