import express,{NextFunction, Request,Response} from "express"
import { prisma } from "../configs/db.config";
import { errorHandler } from "../utils/errorHandler.utils";
import { comparePassword, generateHashedPassword, generateJwtToken } from "../utils/auth.util";

interface SignupUserData {
    email: string;
    password: string;
    name: string;
}

export const signup=async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const {name,email,password}=req.body as SignupUserData;

        const userExists=await prisma.user.findUnique({where:{email}});
        console.log(userExists,"hehe");
        
        if(userExists){
            return next(errorHandler(401,"User already exists with this email!."));
        
        }

       const hashedPassword= await generateHashedPassword(password);

        const user=await prisma.user.create({
            data:{
                name,
                email,
                password:hashedPassword,
            }
        });
        
        const token=generateJwtToken(user.id);

        const {password:pass,...rest}=user;

        res.json({
            msg:"User signup successful!",
            user:rest,
            token,
        })
        return;
    } catch (error) {
        console.log(error);
        next(errorHandler());
    }
}

export const signin=async (req:Request,res:Response,next:NextFunction)=>{
    try {
        console.log("entered");
        
        const {email,password}=req.body as Pick<SignupUserData, "email" | "password">;

        if(!email || !password){
            return next(errorHandler(400,"Please fill all the required details."));
        }

        const userExists=await prisma.user.findUnique({where:{email}});
        console.log(userExists,"hehe");
        
        if(!userExists){
             return next(errorHandler(401,"Invalid credentials"));
        }
        
       const isPasswordCorrect=await comparePassword(password,userExists.password);
        console.log(isPasswordCorrect);
        
       if(!isPasswordCorrect){
        return next(errorHandler(401,"Invalid credentials"));
       }

       const token=generateJwtToken(userExists.id);

       const {password:pass,...rest}=userExists;

       res.json({
        msg:"User signin successful!",
        user:rest,
        token,
       })
       return;
    } catch (error) {
        return next(errorHandler());
    }
}