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
    const userId = req.params.userid;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const totalVideos = await Video.countDocuments({ owner: userId });

    const videos = await Video.find({ owner: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return res.status(200).json(
        new ApiResponse(true, "Videos fetched successfully", {
            videos,
            page,
            limit,
            totalVideos,
            totalPages: Math.ceil(totalVideos / limit)
        })
    );
});

export {
    getChannelStats, 
    getChannelVideos
    }