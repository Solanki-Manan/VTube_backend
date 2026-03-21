import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userid=req.params.userid
    //total videos
    const totalvideos=await Video.countDocuments({owner:userid})
    //total views
    const videos=await Video.find({owner:userid})
    let totalviews=0;
    videos.forEach(video=> {
        totalviews+=video.views;
    })
    // total likes
    const totallikes = await Like.countDocuments({
        video: { $in: videos.map(v => v._id) }
    });

    // total subscribers
    const totalsubscribers = await Subscription.countDocuments({
        channel: userid
    });

     return res.status(200).json(
        new ApiResponse(true, "Stats fetched successfully", {
            totalvideos,
            totalviews,
            totallikes,
            totalsubscribers
        })
    );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userid=req.params.userid
    const videos=await Video.find({owner:userid}).sort({createdAt:-1})
    return res.status(200).json(
        new ApiResponse(true, "Videos fetched successfully", videos)
    );
})

export {
    getChannelStats, 
    getChannelVideos
    }