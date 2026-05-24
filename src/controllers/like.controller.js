import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import {Like} from "../models/like.model.js"
import { Comment } from "../models/comments.model.js";
import { Tweet } from "../models/tweet.model.js";
import redis from "../utils/redis.js";
const togglevideolike= asyncHandler(async(req,res)=>{
    const {videoid}=req.params;
    if(!mongoose.Types.ObjectId.isValid(videoid)){
        throw new ApiError(400,"Invalid video id");
    }
    const video=await Video.findById(videoid);
    if(!video){
        throw new ApiError(404,"Video not found");
    }

    const existinglike=await Like.findOne({
        video:videoid,
        likedBy:req.user._id
    })
    if(existinglike){
        await existinglike.deleteOne();
        return res
        .status(200)
        .json(new ApiResponse(200,true,"Video unliked successfully"))
    }
    const like=await Like.create({
        video:videoid,
        likedBy:req.user._id
    })

    await redis.del(`totallikesofvideo:${videoid}`);

    return res
        .status(200)
        .json(new ApiResponse(200,like,"Video liked successfully"))
    
})

const togglecommentlike=asyncHandler(async(req,res)=>{
    const {commentid}=req.params;
    if(!mongoose.Types.ObjectId.isValid(commentid)){
        throw new ApiError(400,"Invalid comment id");
    }
    const comment=await Comment.findById(commentid);
    if(!comment){
        throw new ApiError(404,"Comment not found");
    }
    const existinglike=await Like.findOne({
        comment:commentid,
        likedBy:req.user._id
    })
    if(existinglike){
        await existinglike.deleteOne();
        return res
        .status(200)
        .json(new ApiResponse(200,true,"Comment unliked successfully"))
    }
    const like=await Like.create({
        comment:commentid,
        likedBy:req.user._id
    })
    await redis.del(`totallikesofcomment:${commentid}`);    
    return res
        .status(200)
        .json(new ApiResponse(200,like,"Comment liked successfully"))
})

const toggletweetlike=asyncHandler(async(req,res)=>{
    const {tweetid}=req.params;
    if(!mongoose.Types.ObjectId.isValid(tweetid)){
        throw new ApiError(400,"Invalid tweet id");
    }
    const tweet=await Tweet.findById(tweetid);
    if(!tweet){
        throw new ApiError(404,"Tweet not found");
    }
    const existinglike=await Like.findOne({
        tweet:tweetid,
        likedBy:req.user._id
    })
    if(existinglike){
        await existinglike.deleteOne();
        return res
        .status(200)
        .json(new ApiResponse(200,true,"Tweet unliked successfully"))
    }
    const like=await Like.create({
        tweet:tweetid,
        likedBy:req.user._id
    })
    await redis.del(`totallikesoftweet:${tweetid}`);    
    return res
        .status(200)
        .json(new ApiResponse(200,like,"Tweet liked successfully"))
})


import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const totallikesofvideo=asyncHandler(async(req,res)=>{
    const {videoid}=req.params;
    if(!mongoose.Types.ObjectId.isValid(videoid)){
        throw new ApiError(400,"Invalid video id");
    }
    const video=await Video.findById(videoid);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    const totallikes=await Like.countDocuments({video:videoid});
    
    let isLiked = false;
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
        try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id);
            if (user) {
                const existinglike = await Like.findOne({video: videoid, likedBy: user._id});
                if (existinglike) isLiked = true;
            }
        } catch(err) {
            // Ignore token verification errors for optional auth
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200,{ totalLikes: totallikes, isLiked },"Total likes fetched successfully"))
})

const totallikesofcomment=asyncHandler(async(req,res)=>{
    const {commentid}=req.params;
    if(!mongoose.Types.ObjectId.isValid(commentid)){
        throw new ApiError(400,"Invalid comment id");
    }
    const comment=await Comment.findById(commentid);
    if(!comment){
        throw new ApiError(404,"Comment not found");
    }
    const totallikes=await Like.countDocuments({comment:commentid});
    return res
        .status(200)
        .json(new ApiResponse(200,totallikes,"Total likes of comment fetched successfully"))
})

const totallikesoftweet=asyncHandler(async(req,res)=>{
    const {tweetid}=req.params;
    if(!mongoose.Types.ObjectId.isValid(tweetid)){
        throw new ApiError(400,"Invalid tweet id");
    }
    const tweet=await Tweet.findById(tweetid);
    if(!tweet){
        throw new ApiError(404,"Tweet not found");
    }
    const totallikes=await Like.countDocuments({tweet:tweetid});
    return res
        .status(200)
        .json(new ApiResponse(200,totallikes,"Total likes of tweet fetched successfully"))
})


const getLikedVideos = asyncHandler(async(req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user._id,
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $lookup: {
                from: "users",
                localField: "videoDetails.owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                _id: "$videoDetails._id",
                title: "$videoDetails.title",
                description: "$videoDetails.description",
                views: "$videoDetails.views",
                createdAt: "$videoDetails.createdAt",
                thumbnailfile: "$videoDetails.thumbnailfile",
                duration: "$videoDetails.duration",
                owner: {
                    _id: "$ownerDetails._id",
                    fullName: "$ownerDetails.fullName",
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar"
                }
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);
    
    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

export {
    togglevideolike,
    totallikesofvideo,
    togglecommentlike,
    toggletweetlike,
    totallikesofcomment,
    totallikesoftweet,
    getLikedVideos
}

