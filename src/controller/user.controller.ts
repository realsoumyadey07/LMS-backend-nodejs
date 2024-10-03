require("dotenv").config();
import ErrorHandler from "../utils/errorHandler";
import { Request, Response, NextFunction } from "express";
import { IUser, User } from "../models/user.model";
import jwt, { Secret } from "jsonwebtoken";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import { sendToken } from "../utils/jwt";

//register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registerUser = CatchAsyncError(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;
    const isEmailExist = await User.findOne({ email });
    if (isEmailExist) {
      return next(new ErrorHandler("Email already exist!", 400));
    }
    const user: IRegistrationBody = {
      name,
      email,
      password,
    };
    const activationToken = createActivationToken(user);
    const activationCode = (await activationToken).activationCode;
    const data = {user: {name: user.name},activationCode};
    const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);
    try {
      await sendMail({
        email: user.email,
        subject: "Account Activation",
        template: "activation-mail.ejs",
        data
      });
      res.status(200).json({
        success: true,
        message: `Please check your email: ${user.email} to activate your account.`,
        activationToken: (await activationToken).token
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});

//generate activationToken
interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = async (
  user: IRegistrationBody
): Promise<IActivationToken> => {
  const activationCode = Math.floor(Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m"
    }
  );
  return {token, activationCode};
};

//activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction)=> {
  try {
    const {activation_token, activation_code} = req.body as IActivationRequest;
    const newUser: {user: IUser; activationCode: string} = jwt.verify(
      activation_token,
      process.env.ACTIVATION_SECRET as Secret
    ) as {user: IUser; activationCode: string};
    if(newUser.activationCode !== activation_code){
      return next(new ErrorHandler("Invalid activation code", 400));
    }  
    const {name, email,password} = newUser.user;
    const existUser = await User.findOne({email});
    if(existUser){
      return next(new ErrorHandler("Email already exist", 400));
    }
    const user = await User.create({
      name,
      email,
      password
    });
    res.status(201).json({
      success: true,
      user
    })
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});

//user login
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction)=> {
  try {
    const {email, password} = req.body as ILoginRequest;
    if(!email || !password){
      return next(new ErrorHandler("Please enter email and password!", 400));
    }
    const user = await User.findOne({email}).select("+password");
    if(!user){
      return next(new ErrorHandler("Invalis email or password! try again", 400));
    }
    const isPasswordMatched = await user.comparePassword(password);
    if(!isPasswordMatched){
      return next(new ErrorHandler("Invalid email or password",400));
    }
    sendToken(user, 200, res);
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
});

//logout user
export const logoutUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction)=> {
  try {
    res.cookie("access_token", "", {maxAge: 1});
    res.cookie("refresh_token", "", {maxAge: 1});
    res.status(200).json({
      success: true,
      message: "User logged out successfully"
    })
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
})
