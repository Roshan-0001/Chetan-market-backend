import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';



const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:"true", limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from "./routes/router.js";
import adminRouter from './routes/admin.router.js';

app.use("/api/user", userRouter);
app.use("/admin", adminRouter);




export {app};
