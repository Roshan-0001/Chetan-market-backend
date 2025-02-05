import mongoose, { Schema } from 'mongoose';
import bcrypt from "bcrypt";

const adminSchema = new Schema(
    {
        username:{
            type: "string",
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        fullName:{
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
        }
    },
    {
        timestamps: true
    }
)
userSchema.pre("save" , async function() {
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isValidPassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}




export const Admin = mongoose.model("Admin", adminSchema);      