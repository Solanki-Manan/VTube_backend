import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import {v2 as cloudinary} from "cloudinary"
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { addVideoToQueue } from "../queue/video.producer.js";

import redis from "../utils/redis.js";


const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body


    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required")
    }
    const videoLocalPath = req.files?.videofile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnailfile?.[0]?.path
    if(!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    //create video entry in db with ispublished false
    const video = await Video.create({
        title,
        description,
        owner: req.user._id,
        videofile: "",
        thumbnailfile: "",
        videofilepublicid: "",
        thumbnailpublicid: "",
        thumbnailLocalPath:thumbnailLocalPath,
        ispublished: false
    })

    //send video to processing queue
    await addVideoToQueue({
        videoId: video._id,
        videoLocalPath,
        thumbnailLocalPath
    })

    return res.status(202).json(
        new ApiResponse(202, true, "Video is being processed...")
    );

})

const getallvideos = asyncHandler(async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = req.query.q;
    const filter = { ispublished: true };
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    const sortBy = req.query.sortBy || "createdAt";
    const sortType = req.query.sortType === "asc" ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortType;

    const totalvideos = await Video.countDocuments(filter)

    const videos = await Video.find(filter)
        .populate("owner", "fullName username email avatar")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        
    return res
    .status(200).json(
        new ApiResponse(200,{
            totalvideos,
            totalpages: Math.ceil(totalvideos/limit),
            currentpage: page,
            videos  
        },"All published videos fetched successfully")
    )
})


const getvideobyid = asyncHandler(async (req, res) => {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid video ID")
        }

        // First fetch the video without incrementing to check published status
        const video = await Video.findById(id).populate("owner", "fullName username email avatar");

        if (!video) {
            throw new ApiError(404, "Video not found")
        }

        if (!video.ispublished) {
            throw new ApiError(403, "This video is not yet available")
        }

        // Use a Redis key per IP + videoId to prevent view count spam (24hr lock)
        const viewerIp = req.ip || req.connection?.remoteAddress || 'unknown';
        const viewLockKey = `viewlock:${viewerIp}:${id}`;
        const alreadyViewed = await redis.get(viewLockKey);

        if (!alreadyViewed) {
            // First view in 24hrs — increment and set lock
            await Video.findByIdAndUpdate(id, { $inc: { views: 1 } });
            await redis.set(viewLockKey, '1', 'EX', 86400); // 24 hours TTL
            video.views = video.views + 1; // Update local copy for response
        }

        return res
            .status(200)
            .json(new ApiResponse(200, video, "Video fetched by your given id"))
})

const updatevideo= asyncHandler(async (req, res) => {
        const { id } = req.params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid video ID")
        }
        const { title, description } = req.body
        if (!title?.trim() || !description?.trim()) {
            throw new ApiError(400, "Title and description are required")
        }
        const video = await Video.findById(id)
        if (!video) {
            throw new ApiError(404, "Video not found")
        }
        if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not authorized to update this video")
        }
        video.title = title || video.title
        video.description = description || video.description
        await video.save()

             // all videos list
         const keys = await redis.keys("videos:*");
            if (keys.length > 0) {
                await redis.del(keys);
            }       
         await redis.del(`video:${id}`);   // single video

        return res
            .status(200)
            .json(new ApiResponse(200, true, "Video updated successfully"))
})

const deletevideo=asyncHandler(async (req, res) => {
        const { id } = req.params
        if(!mongoose.Types.ObjectId.isValid(id)){
            throw new ApiError(400, "Invalid video ID")
        }
        const video=await Video.findById(id)
        if(!video){
            throw new ApiError(404, "Video not found")
        }

        if(video.owner.toString() !== req.user._id.toString()){
            throw new ApiError(403, "You are not authorized to delete this video")
        }

        await cloudinary.uploader.destroy(video.videofilepublicid, {
        resource_type: "video"
        })

        await cloudinary.uploader.destroy(video.thumbnailpublicid)

        await video.deleteOne()

             // all videos list
         const keys = await redis.keys("videos:*");
        if (keys.length > 0) {
            await redis.del(keys);
        }       
         await redis.del(`video:${id}`);   // single video

        return res
        .status(200)
        .json(new ApiResponse(200, true, "Video deleted successfully"))
})

export {
     publishVideo ,
    getallvideos,
    getvideobyid,
    updatevideo,
    deletevideo
    }