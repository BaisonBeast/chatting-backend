import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "../enums/statusCodes.enum";

interface AuthRequest extends Request {
    user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Access Denied: No Token Provided" });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || "fallbacksecret");
        req.user = verified;
        next();
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Token Expired" });
        }
        return res.status(StatusCodes.FORBIDDEN).json({ message: "Invalid Token" });
    }
};
