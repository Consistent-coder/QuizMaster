import express,{NextFunction, Request,Response} from "express";
import cors from "cors";
import dotenv from "dotenv";
import { CLIENT_URL, PORT } from "./configs/app.config";
import { HTTPError } from "./utils/errorHandler.utils";
import { authRouter } from "./routers/auth.router";
import { quizRouter } from "./routers/quiz.router";

dotenv.config();

export const app=express();
app.use(express.json());

app.use(cors({
    origin:CLIENT_URL,
    credentials:true,
}));

app.use("/api/v1/auth",authRouter);
app.use("/api/v1/quiz",quizRouter);

app.get("/", (req: Request, res: Response) => {
    res.json({msg:"Welcome to Quiz App."});
    return;
});


app.use((err:HTTPError,req:Request,res:Response,next:NextFunction)=>{
    console.log(err.message);
    
    const status=err.statusCode || 500;
    const msg=err.message || "Internal Server Error";
    res.status(status).json({ 
        success:false,
        status,
        msg,
    });

    return;
});