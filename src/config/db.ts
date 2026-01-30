import logger from "@utils/logger";
import chalk from "chalk";
import mongoose from "mongoose";


const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`Connected To Mongodb Database ${conn.connection.host} at ${new Date().toISOString()}`);
    } catch (error) {
        console.log(`Error in Mongodb ${error}`);
        process.exit(1);
    }
};

export default connectDB;
