export class HTTPError extends Error {
    statusCode: number;

    constructor(statusCode:number,message:string){
        super(message);
        this.statusCode=statusCode;

        Object.setPrototypeOf(this,HTTPError.prototype);
    }
}

export function errorHandler(statusCode:number=500,msg:string=""){
    const error=new HTTPError(statusCode,msg);

    return error;
}