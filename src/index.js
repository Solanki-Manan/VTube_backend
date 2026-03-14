import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const app = express();

import userRouter from "./routes/user.routes.js";
import connectDB from "./db/index.js";

import cookieParser from "cookie-parser";

app.use(cookieParser());   // 👈 YE LINE ADD KARO -- e thek bhale ha 


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/users", userRouter);

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.log("Error in DB connection:", err);
    });
