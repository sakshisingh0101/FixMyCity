import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";

export const verifyjwt= asyncHandler(async(req,next,res)=>{
    try {
        let token = req.cookies?.accessToken;
    if(!token)
    {
        const tokenheader= req.headers.authorization
        if(!tokenheader||!tokenheader.startsWith("Bearer "))
        {
            throw new ApiError(401, "Authorization token is missing")
        }
        token = tokenheader.replace("Bearer ","").trim()

    }
    const decodedInfo=  jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedInfo._id)
    if(!user)
    {
        throw new ApiError(401,"Invalid Access Token")
    }
    req.user=user
    next();
    } catch (error) {
        console.log("Error: ", error?.message)
        throw new ApiError(401, error?.message || "Invalid Access Token");

    }
    

})