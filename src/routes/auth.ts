import { Router } from "express";
import { createNewUser } from "src/controllers/auth";

const authRouter = Router();

authRouter.post("/sign-up", createNewUser);

export default authRouter;