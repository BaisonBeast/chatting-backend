import {
    uniqueNamesGenerator,
    Config,
    adjectives,
    colors,
} from "unique-names-generator";
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "src/server/config/firebase";

const customConfig: Config = {
    dictionaries: [adjectives, colors],
    separator: "-",
    style: "capital",
    length: 2,
};

export const randomNameGenerator = (username: string) => {
    if (username !== "") return username;
    else {
        return uniqueNamesGenerator(customConfig);
    }
};

export const uploadImage = async(file: Express.Multer.File) => {
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