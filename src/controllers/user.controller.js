import { User } from "../models/user.model.js";
import nodemailer from 'nodemailer';
import { AsyncHandler } from "../utills/Asynchandaler.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { otpStorage } from "../constant.js";
import OTPGenerator, { generate } from 'otp-generator';
import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import { UploadOnCloudinary } from "../utills/cloudinary.js";

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
                    new ApiError(409, this, "user already existed")
                );
            }

            // checking for image local path
            const imageLocalPath = req.files?.avatar[0]?.path;
            if(!imageLocalPath){
                throw new ApiError(400, this, "image is required");
            }

            // uloading image to the cloudinary
            const profileImage = await UploadOnCloudinary(imageLocalPath);


            if (!profileImage) {
                throw new ApiError(400, this, "failed to upload image");
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
                    new ApiError(406, this, "something went wrong while creating user")
                );
            } else {
                return res.status(201).json(
                    new ApiResponse(201, userCreated, "user created successfully")
                );
            }

        } catch (error) {
            console.log("error is ----- ", error);
        }
    }
)
// sends otp to the user end to the email
const otpSender = AsyncHandler(
    async (req, res) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // or another service like 'hotmail', 'yahoo', etc.
            host: 'smtp.gmail.com',
            port: 465,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const email = req.body.email;

        const otp = OTPGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });




        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                // throw new ApiError(400, "Error sending otp", error);
                return res.status(500).json(
                    new ApiError(500, error, "failed to send otp")
                );

            } else {
                res.status(200).json(
                    new ApiResponse(201, 'otp sended successfully')
                );
                otpStorage[email] = otp;
                console.log('otp sended', otpStorage);
            }
        });


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

// verifies the otp given by the user for the email
const otpVerifier = AsyncHandler(
    async (req, res) => {
        const data = req.body;
        const { email, otp } = data;
        let user = await User.find({ email }).select("-password");

        if (otpStorage[email] === otp) {
            delete otpStorage[email];

            await User.updateOne({ _id: user[0]._id }, { $set: { isVerified: true } });

            return res.status(201).json(
                new ApiResponse(201, user, "user verified successfully")
            );
        } else {
            return res.status(400).json(
                new ApiResponse(407, this, "invalid otp")
            );
        }
    }
)
// login the user with the help of the password
const passwordLogin = AsyncHandler(
    async (req, res) => {
        // take details from the body
        const { username, password } = req.body;

        //checking for the required details is present or not
        if (!username || !password) {
            return res.status(400).json(
                new ApiError(400, null, "All fields are Required")
            )
        }

        //checking the username is present in the database or not
        const existedUser = await User.findOne({ username });

        if (!existedUser) {
            return res.status(401).json(
                new ApiError(401, null, "Invalid credentials")
            );
        }

        //checking the given password with the existing password

        const isPasswordValid = await bcrypt.compare(password, existedUser.password);
        if (!isPasswordValid) {
            return res.status(401).json(
                new ApiError(401, null, "Invalid credentials")
            );
        }

        const loggedInUser = await User.findById(existedUser._id).select("-password ");
        return res.status(200).json(
            new ApiResponse(200, loggedInUser, "user loged in successfully")
        );

    }
)
// login the user with the help of the otp for email
const otpLogin = AsyncHandler(
    async (req, res) => {
        const { username, email } = req.body;

        if (!username && !email) {
            return res.status(400).json(
                new ApiError(400, null, "username or email is required for login")
            );
        }

        const userExist = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (!userExist) {
            return res.status(400).json(
                new ApiError(400, null, "invalid credentials")
            );
        }

        const mail = { email: userExist.email };

        return res.status(201).json(
            new ApiResponse(201, mail, "User found")
        );

    }
)
//sends otp to the user end to the number
// const otpSenderNumber = AsyncHandler(
//     async(req, res) =>{
//         const number = req.body.number;

//         // const otp = await generateOTP();

//         const response = await sendOtpToNumber(number);

//         console.log(response);
//         if(response.ok){
//             return res.status(200).json(
//                 new ApiResponse(200, response, "otp sended successfully")
//             );
//         } else {
//             return res.status(500).json(
//                 new ApiError(500, "failed to send otp", response)
//             );
//         }

//     }); 

export { registerUser, otpSender, otpVerifier, passwordLogin, otpLogin, loginUser, logoutUser };