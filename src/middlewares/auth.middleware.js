
import { AsyncHandler } from "../utills/Asynchandaler.js";
import { ApiError } from "../utills/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const  verifyJWT = AsyncHandler(async (req, res, next) => {
   try {
     const  token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
     if (!token){
        return  res.status(401).json(new ApiError(401, "Unauthorized request"))
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id).select("-password")
 
     if(!user) {
        return  res.status(401).json(new ApiError(401, "Invalid access Token"))
     }
 
     req.user = user;
     next()
   } catch (error) {
      return  res.status(401).json(new ApiError(401, error?.message || "Invalid access token"))
   }
})