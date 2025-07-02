import express, { NextFunction, Request, Response } from "express"
import { errorHandler } from "../utils/errorHandler.utils";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../configs/tokens.config";
import { prisma } from "../configs/db.config";

const getToken = (req: Request) => {
    const cookieToken = req.cookies?.token;
    const authHeader = req.header('Authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    return cookieToken || headerToken;
};


export const verifyJwtToken = async (req: Request, res: Response, next: NextFunction) => {
    const token = getToken(req);
    if (!token) {
        return next(errorHandler(401, "Unauthorized Access."));
    }

    try {

        jwt.verify(token, JWT_SECRET, async (err: Error | null, decodedUser: JwtPayload | string | undefined) => {

            if (err || typeof decodedUser !== "object" || !("id" in decodedUser)) {
                return next(errorHandler(401, "Unauthorized access"));
            }


            console.log(decodedUser, "This is decoded user");

            const user = await prisma.user.findUnique({
                where: {
                    id: decodedUser?.id
                }
            });

            if(!user){
                return next(errorHandler(401,"Unauthorized Access"));
            }
            req.user = user;
            next();
        });

    } catch (error) {
        next(errorHandler());
    }
}

export const isAdmin=(req:Request,res:Response,next:NextFunction)=>{
    const user=req.user;
    if(!user || req.user?.role!=="ADMIN"){
        return next(errorHandler(403,"Admin access only!"));
    }
    next();
}