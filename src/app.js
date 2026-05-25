import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './utils/swagger.js';

import morgan from "morgan";
import { apiLimiter } from "./middlewares/ratelimiter.middleware.js";
const app=express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.set("trust proxy", 1); // Trust 1 proxy hop to correctly extract client IP behind Render/Cloudflare
app.use(helmet()) // for setting various HTTP headers for security
app.use(apiLimiter);

app.use(cors({
    origin: [
      process.env.CORS_ORIGIN,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ],
    credentials: true,
}))

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))

app.use(express.static("public"))
app.use(cookieParser())


app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

//routes here

import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import commentRouter from './routes/comment.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import healthRouter from './routes/healthcheck.routes.js';
import likeRouter from './routes/like.routes.js';
 import playlistRouter from './routes/playlist.routes.js';
 import subscriptionRouter from './routes/subscription.routes.js';
 import tweetRouter from './routes/tweet.routes.js';


//routes declaration

app.use("/api/v1/users",userRouter);
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/comments",commentRouter)
 app.use("/api/v1/dashboard",dashboardRouter)
app.use("/api/v1/health",healthRouter)
app.use("/api/v1/likes",likeRouter)
 app.use("/api/v1/playlists",playlistRouter)
 app.use("/api/v1/subscriptions",subscriptionRouter)
 app.use("/api/v1/tweets",tweetRouter)


//  app.get("/test-redis", async (req, res) => {
//     await redis.set("fullname", "Manan", "EX", 60);

//     const data = await redis.get("fullname");

//     res.json({ data });
// });

// http://localhost:8000/api/v1/users/register

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
});

export {app}