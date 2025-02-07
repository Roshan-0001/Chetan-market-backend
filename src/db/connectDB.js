import mongoose from "mongoose";

const connectDB= async() =>{
    try{
        const connectionInstance=  await mongoose.connect(process.env.DB_URL)
        console.log(`MongoDB connected !! DB Host: ${connectionInstance.connection.host}`);
        
    } catch(error){
        console.log("MONGODB connection eroor", error);
        process.exit(5);
    }
}

export default connectDB;