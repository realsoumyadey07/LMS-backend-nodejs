require("dotenv").config();
import ErrorHandler from "../utils/errorHandler";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import jwt, { Secret } from "jsonwebtoken";

//register user

interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.params;
    const isEmailExist = await User.findOne({ email });
    if (!isEmailExist) {
      return next(new ErrorHandler("Email already exist!", 400));
    }
    const user: IRegistrationBody = {
      name,
      email,
      password,
    };
    const activationToken = createActivationToken(user);
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
};

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
