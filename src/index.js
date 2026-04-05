import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express from "express";
import {app} from "./app.js";
import { connectRedis } from "./utils/redis.js";
import connectDB from "./db/index.js";
// import cookieParser from "cookie-parser";
// app.use(cookieParser());   // 👈 YE LINE ADD KARO -- e thek bhale ha 
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));


// import userRouter from "./routes/user.routes.js";
// import videoRouter from "./routes/video.routes.js";
// import likeRouter from "./routes/like.routes.js"
// import commentRouter from "./routes/comment.routes.js";
// import  healthRouter  from "./routes/healthcheck.routes.js";

// app.use("/api/v1/users", userRouter);
// app.use("/api/v1/videos", videoRouter);
// app.use("/api/v1/likes", likeRouter);
// app.use("/api/v1/comments", commentRouter);
// app.use("/api/v1/health",healthRouter);


connectDB()
    .then(async () => {
        await connectRedis();
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.log("Error in DB connection:", err);
    });
