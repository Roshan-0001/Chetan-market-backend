
import { AsyncHandler } from "../utills/Asynchandaler.js";
import { ApiError } from "../utills/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";

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

export const  verifyAdminJWT = AsyncHandler(async (req, res, next) => {
   try {
     const  token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
     if (!token){
        return  res.status(401).json(new ApiError(401,null,  "Unauthorized request"))
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     const admin = await Admin.findById(decodedToken?._id).select("-password")
 
     if(!admin) {
        return  res.status(401).json(new ApiError(401,null,  "Invalid access Token"))
     }
 
     req.admin = admin;
     next()
   } catch (error) {
      return  res.status(401).json(new ApiError(401,null,  error?.message || "Invalid access token"))
   }
})