
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { AsyncHandler } from "../utills/Asynchandaler.js";
import { UploadOnCloudinary } from "../utills/Cloudinary.js";
import {User} from "../models/user.model.js";
// generating acess token
const generateAccessToken = async(userId) =>
    {
        try {
            const user = await User.findById(userId)
            const accessToken = user.generateAccessToken()
            return accessToken
        } catch (error) {
            return  res.status(500).json(new ApiError(500, "something went wrong while generating access token"))
        }
}
// registration of the user 
const registerUser = AsyncHandler(
    async (req, res) => {
        try {
            //to get the data from the frontend..
            const { username, email, password, number, address, shopType, description } = req.body;

            //to validate any of the field is missing or not..
            if (
                [username, email, password, number, shopType].some((field) => field == null || field.trim() === "")
            ) {
                return res.status(400).json(
                    new ApiError(400, req.body, "All feilds are required")
                );
            }
            // checking user is already existed or not..
            const existedUser = await User.findOne({
                $or: [{ username }, { email }, { number }]
            })

            if (existedUser) {
                return res.status(409).json(
                    new ApiError(409,null,   "user already existed")
                );
            }

            // checking for image local path
            const imageLocalPath = req.files?.profileImage[0]?.path;
            if(!imageLocalPath){
                return res.status(409).json(
                    new ApiError(400, null, "image is required")
                );
            }

            // uloading image to the cloudinary
            const profileImage = await UploadOnCloudinary(imageLocalPath);


            if (!profileImage) {
                return res.status(409).json(
                    new ApiError(400, this, "failed to upload image")
                );
            }


            const user = await User.create({
                email,
                password,
                username: username.toLowerCase(),
                number,
                address,
                shopType,
                description,
                profileImage: profileImage.url

            })

            // checks for user creation
            const userCreated = await User.findById(user.id).select("-password")

            if (!userCreated) {
                return res.status(406).json(
                    new ApiError(406, null, "something went wrong while creating user")
                );
            } else {
                return res.status(201).json(
                    new ApiResponse(201, userCreated, "user created successfully")
                );
            }

        } catch (error) {
            return res.status(406).json(
                new ApiError(406, error, "something went wrong while creating user")
            );
        }
    }
)

// for login
const loginUser = AsyncHandler(async (req, res) => {

    //request body -> data
    const{email, username, password} = req.body

    //check username or email
    if(!username && !email){
        return res.status(400).json(new ApiError(400, "username or email is required"))
    }

    //find the user iu
    const user = await  User.findOne({
        $or:[{username}, {email}]
    })

    if(!user){
        return  res.status(404).json(new ApiError(404, "User does not exist"))
    }
    //password check
    const isPasswordvalid = await  user.isPasswordCorrect(password)
    if(!isPasswordvalid){
        return  res.status(404).json(new ApiError(401, "invalid credentials"))
    }

    //generating access token 
    const accessToken =await generateAccessToken(user._id)

    //sending cookies
    const loggedInUser = await User.findById(user._id).select("-password ")

    const options ={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken
            },
            "User loggedin successfully"
        )
    )
})

// for logout
const logoutUser = AsyncHandler(async (req,res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                accessToken: 1
            }
        },
        {
            new: true
        }
    )

    const options ={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)   
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})


export {registerUser, loginUser, logoutUser}