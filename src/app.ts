require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middlewares/error.middleware";
import userRouter from "./routes/user.route";

app.use(express.json({limit: "50mb"}));
app.use(cookieParser());
app.use(cors({
     origin: process.env.ORIGIN
}));

//testing api
app.get("/test", (req: Request, res: Response, next: NextFunction)=> {
     res.status(200).json({
          success: true,
          message: "API is working"
     });
});

//routes
app.use("/api/v1", userRouter);

//unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
     const err = new Error(`Route ${req.originalUrl} not found!`) as any;
     err.statusCode = 404;
     next(err);
});

app.use(ErrorMiddleware);