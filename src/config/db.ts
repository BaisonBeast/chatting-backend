import logger from "@utils/logger";
import chalk from "chalk";
import mongoose from "mongoose";
import { server } from "src/server";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`Conneted To Mongodb Databse ${conn.connection.host}`);
        server.listen(PORT, () => {
            logger.info(chalk.blue(`Server Running on port ${PORT}`));
        });
    } catch (error) {
        console.log(`Errro in Mongodb ${error}`);
    }
};

export default connectDB;
