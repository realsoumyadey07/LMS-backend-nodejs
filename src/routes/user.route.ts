import express from "express";
import { activateUser, loginUser, logoutUser, registerUser } from "../controller/user.controller";
registerUser
const userRouter = express.Router();

userRouter.post("/registration", registerUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);

export default userRouter;