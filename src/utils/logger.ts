import { createLogger, format, transports } from "winston";
import { TransformableInfo } from "logform";

const { combine, timestamp, printf, colorize } = format;

const customFormat = printf((info: TransformableInfo) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
});

const logger = createLogger({
    level: "info",
    format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        customFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: "server.log", level: "info" }),
    ],
});

export default logger;
