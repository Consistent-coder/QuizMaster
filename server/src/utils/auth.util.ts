import bycrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../configs/tokens.config";

export async function generateHashedPassword(password:string){
    const hashedPassword=await bycrypt.hash(password,10);
    return hashedPassword;
}

export async function comparePassword(password:string,hash:string):Promise<boolean>{
    console.log(password,hash,"password has");
    return await bycrypt.compare(password,hash);
}


export function generateJwtToken(id:string){
return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as any);
}