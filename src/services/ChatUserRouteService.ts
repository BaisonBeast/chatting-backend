import {
    uniqueNamesGenerator,
    Config,
} from "unique-names-generator";
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "src/server/config/firebase";
import { CUSTOM_NAME_CONFIG, PROFILE_IMAGES } from "../utils/constants";


export const randomNameGenerator = (username: string) => {
    if (username !== "") return username;
    else {
        return uniqueNamesGenerator(CUSTOM_NAME_CONFIG);
    }
};

export const uploadImage = async (file: Express.Multer.File) => {
    const metadata = {
        contentType: file.mimetype,
    };
    const userId = uuidv4();
    const storageRef = ref(storage, `profile_pictures/${userId}`);
    const uploadResult = await uploadBytes(
        storageRef,
        file.buffer,
        metadata
    );
    const profilePictureUrl = await getDownloadURL(uploadResult.ref);
    return profilePictureUrl;
}

export const randomImage = () => {
    const randomNumber = Math.floor(Math.random() * 5);
    return PROFILE_IMAGES[randomNumber];
}