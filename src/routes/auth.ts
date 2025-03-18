import { Router } from "express";
import { createNewUser, generateVerificationLink, grantAccessToken, sendProfile, signIn, signOut, verifyEmail } from "src/controllers/auth";
import { isAuth } from "src/middleware/auth";
import validate from "src/middleware/validator";
import { newUserSchema, verifyTokenSchema } from "src/utils/validationSchema";

const authRouter = Router();

authRouter.post("/sign-up", validate(newUserSchema), createNewUser);
authRouter.post("/verify", validate(verifyTokenSchema), verifyEmail);
authRouter.get("/verify-token", isAuth, generateVerificationLink);
authRouter.post("/sign-in", signIn);
authRouter.get("/profile", isAuth, sendProfile);
authRouter.post("/refresh-token", grantAccessToken);
authRouter.post("/sign-out", isAuth, signOut);

export default authRouter;