import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import {Like} from "../models/like.model.js"

const togglelike= asyncHandler(async(req,res)=>{
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
    return res
        .status(200)
        .json(new ApiResponse(200,like,"Tweet liked successfully"))
})


const  totallikesofvideo=asyncHandler(async(req,res)=>{
    const {videoid}=req.params;
    if(!mongoose.Types.ObjectId.isValid(videoid)){
        throw new ApiError(400,"Invalid video id");
    }
    const video=await Video.findById(videoid);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    const totallikes=await Like.countDocuments({video:videoid});
    return res
        .status(200)
        .json(new ApiResponse(200,totallikes,"Total likes fetched successfully"))
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


export {
    togglelike,
    totallikesofvideo,
    togglecommentlike,
    toggletweetlike,
    totallikesofcomment,
    totallikesoftweet
}

