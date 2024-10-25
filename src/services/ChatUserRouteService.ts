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

const images = [
    'https://firebasestorage.googleapis.com/v0/b/image-storage-4449d.appspot.com/o/profile_pictures%2Fopenart-image_Oxy4Cvxl_1727111366456_raw.jpg?alt=media&token=7fc0a3ad-a024-4416-ad86-559983c60edd',
    'https://firebasestorage.googleapis.com/v0/b/image-storage-4449d.appspot.com/o/profile_pictures%2Fopenart-image_PNkST6ao_1727111393143_raw.jpg?alt=media&token=05bf1a44-5fa6-4b93-9459-a94c792340d5',
    'https://firebasestorage.googleapis.com/v0/b/image-storage-4449d.appspot.com/o/profile_pictures%2Fopenart-image_ST99ko3F_1727111319266_raw.jpg?alt=media&token=bca10d01-fdf2-41cc-9adf-4fd2625791fd',
    'https://firebasestorage.googleapis.com/v0/b/image-storage-4449d.appspot.com/o/profile_pictures%2Fopenart-image_W6WgPhZN_1727111273414_raw.jpg?alt=media&token=b42299ac-6da2-4731-bf21-c53637d772e8',
    'https://firebasestorage.googleapis.com/v0/b/image-storage-4449d.appspot.com/o/profile_pictures%2Fopenart-image_tgLqdIv6_1727111229259_raw.jpg?alt=media&token=50d72ffd-d65f-43a2-b420-9ab6bbb461d6'
]

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

export const randomImage = () => {
    const randomNumber = Math.floor(Math.random() * 5);
    return images[randomNumber];
}