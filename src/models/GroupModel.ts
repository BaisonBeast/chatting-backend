import mongoose from "mongoose";

const ParticipantSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
        },
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

const GroupSchema = new mongoose.Schema(
    {
        groupName: {
            type: String,
            required: true,
        },
        messages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message",
                default: [],
            },
        ],
        participants: [
            {
                type: ParticipantSchema,
            },
        ],
        background: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true }
);

const Group = mongoose.model("Group", GroupSchema);
export default Group;
export { GroupSchema };
