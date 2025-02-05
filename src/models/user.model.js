import mongoose, { Schema } from 'mongoose';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username:{
            type: "string",
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email:{
            type: "string",
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        number:{
            type: "number",
            required: true,
            unique: true,
        },
        password:{
            type: "string",
            require: [true, "password is require"]
        },
        isVerified:{
            type: "boolean",
            default: false
        },
        address:{
            type: "string",
            required: true
        },
        profileImage:{
            type: "string",
        },
        shopType:{
            type: "string",
            required: true,
            enum: ["grocery", "bakery", "restaurant", "stationary", "pharmacy", "clothing", "electronics", "cosmetics", "internet-cafe","other"]
        },
        description:{
            type: "string",
            required: true
        },
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
 

export const User = mongoose.model("User", userSchema);