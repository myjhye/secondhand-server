import { Router } from "express";
import { createNewUser, verifyEmail } from "src/controllers/auth";

const authRouter = Router();

authRouter.post("/sign-up", createNewUser);
authRouter.post("/verify", verifyEmail);

export default authRouter;