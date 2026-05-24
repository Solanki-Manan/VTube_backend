import dotenv from "dotenv";
dotenv.config();
import { Worker } from "bullmq";
import  uploadOnCloudinary  from "../utils/cloudinary.js";
import redis from "../queue/redis.connection.js";
import { Video } from "../models/video.model.js";
import fs from "fs";
import mongoose from "mongoose";
import { connection } from "../queue/queue.config.js";


dotenv.config();
if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected in worker");
}

const videoWorker = new Worker("video-processing", async (job) => {
   try {
    const{videoId,videoLocalPath,thumbnailLocalPath}=job.data;

    console.log("Processing video:-",videoId)
    const videofile=await uploadOnCloudinary(videoLocalPath);
     const thumbnailfile=await uploadOnCloudinary(thumbnailLocalPath);
     if(!videofile || !thumbnailfile){
         throw new Error("Failed to upload video or thumbnail to Cloudinary");
     }
 
     //update db
     await Video.findByIdAndUpdate(videoId,{
         videofile:videofile.secure_url,
         videofilepublicid:videofile.public_id,
         thumbnailfile:thumbnailfile.secure_url,
         thumbnailpublicid:thumbnailfile.public_id,
         duration:videofile.duration,
         ispublished:true
     });
     console.log(`Video processed and database updated successfully`);
   } catch (error) {
     console.error("Error processing video:", error);
     throw error;
   }
},
{
    connection:{
        url: process.env.REDIS_URI,
        tls: {} //  required for Upstash
    }
}
);



export default videoWorker;