import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "src/server/config/firebase";

export const uploadFile = async(file: Express.Multer.File) => {
    const metadata = {
        contentType: file.mimetype,
    };
    const userId = uuidv4();
    const storageRef = ref(storage, `files/${userId}`);
    const uploadResult = await uploadBytes(
        storageRef,
        file.buffer,
        metadata
    );
    const fileUrl = await getDownloadURL(uploadResult.ref);
    return fileUrl;
}
