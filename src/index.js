import { config } from 'dotenv';
import connectDB from "./db/connectDB.js";
import { app } from './app.js';


config({
    path: './.env'
});

connectDB()
.then(() =>{
    app.listen(process.env.PORT || 3000, ()=>{
        console.log(` server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!", err);
})  