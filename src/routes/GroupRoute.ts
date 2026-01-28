import express from "express";
import { createGroup, getAllGroups } from "../controllers/GroupController";

const router = express.Router();

router.post("/create", createGroup);
router.get("/getAllGroups", getAllGroups);

export default router;
