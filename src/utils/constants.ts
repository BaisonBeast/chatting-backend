import { Config, adjectives, colors } from "unique-names-generator";

export const CUSTOM_NAME_CONFIG: Config = {
    dictionaries: [adjectives, colors],
    separator: "-",
    style: "capital",
    length: 2,
};

export const PROFILE_IMAGES = [
    'https://firebasestorage.googleapis.com/v0/b/image-storage-4449d.appspot.com/o/profile_pictures%2Fopenart-image_Oxy4Cvxl_1727111366456_raw.jpg?alt=media&token=7fc0a3ad-a024-4416-ad86-559983c60edd',
    'https://firebasestorage.googleapis.com/v0/b/image-storage-4449d.appspot.com/o/profile_pictures%2Fopenart-image_PNkST6ao_1727111393143_raw.jpg?alt=media&token=05bf1a44-5fa6-4b93-9459-a94c792340d5',
    'https://firebasestorage.googleapis.com/v0/b/image-storage-4449d.appspot.com/o/profile_pictures%2Fopenart-image_ST99ko3F_1727111319266_raw.jpg?alt=media&token=bca10d01-fdf2-41cc-9adf-4fd2625791fd',
    'https://firebasestorage.googleapis.com/v0/b/image-storage-4449d.appspot.com/o/profile_pictures%2Fopenart-image_W6WgPhZN_1727111273414_raw.jpg?alt=media&token=b42299ac-6da2-4731-bf21-c53637d772e8',
    'https://firebasestorage.googleapis.com/v0/b/image-storage-4449d.appspot.com/o/profile_pictures%2Fopenart-image_tgLqdIv6_1727111229259_raw.jpg?alt=media&token=50d72ffd-d65f-43a2-b420-9ab6bbb461d6'
];

export const MESSAGES = {
    USER_NOT_FOUND_EMAIL: "User not Exist with this email..",
    USER_NOT_EXIST: "User not Exist",
    USER_NOT_FOUND: "USER NOT FOUND!!",
    USER_NOT_FOUND_SIMPLE: "User not found",
    USER_NOT_FOUND_CONFLICT: "User not found with this email",
    INTERNAL_SERVER_ERROR: "Something Went Wrong",
    INVITE_LIST_FETCHED: "All invitelist fetched",
    CHAT_LIST_FETCHED: "All chatList fetched",
    USER_ALREADY_IN_CHAT: "User already added in the chat-list",
    INVITE_EXISTS: "Invite already exists for this email.",
    INVITE_SENT: "Invite sent",
    INVITE_REMOVED: "Invite removed successfully",
    USER_ADDED_TO_CHAT: "User added to your chatList",
    USER_ADDED_TO_CHATLIST: "User added to the chatlist",
    USERS_NOT_FOUND: "One or both users not found",
    CHAT_NOT_FOUND: "Chat not found",
    REMOVED_CHAT: "Removed chat",
    CHAT_LIST_REMOVED: "ChatList removed",
    NO_SUGGESTIONS: "No suggestions returned from API",
    NO_REPLY_SUGGESTIONS: "No reply suggestions returned from API",
    ALL_MESSAGES_FETCHED: "All messages fetched",
    FILE_UPLOAD_FAILED: "File upload failed",
    MESSAGE_SENT: "Message Sent",
    MESSAGE_NOT_FOUND: "Message not Found",
    MESSAGE_DELETED_CONTENT: "deleted",
    CANNOT_LIKE_TWICE: "Cannot like two times",
    PASSWORD_MISMATCH: "Password does not match!!",
    LOGGED_IN: "Successfully Logged In!!",
    USER_EXISTS_EMAIL: "User Already exist with this email",
    REGISTERED: "User Successfully Registerd!!",
    UPDATED: "User Successfully Updated!!",
};

export const SOCKET_EVENTS = {
    NEW_INVITE: "newInvite",
    CREATE_CHAT: "createChat",
    REMOVE_CHAT: "removeChat",
    NEW_MESSAGE: "newMessage",
    DELETE_MESSAGE: "deleteMessage",
    MESSAGE_EDITED: "Message Edited",
    LIKE_MESSAGE: "likemessage",
};

export const CONFIG = {
    GEMINI_MODEL: "gemini-flash-latest",
    FALLBACK_SECRET: "fallbacksecret",
    TOKEN_EXPIRY: "1d",
};
