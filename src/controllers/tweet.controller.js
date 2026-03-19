import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    try {
        const {content} = req.body
        const ownerId = req.user._id
        if(!content.trim()){
            throw new ApiError(400,"Content must be a valid string")
        }
        const tweet = await Tweet.create({
            content,
            owner:ownerId
        })
        return res
        .status(200)
        .json(new ApiResponse(200,true,"Tweet created sucessfully"))
    } catch (error) {
        throw new ApiError(500,"Error while creating tweet")
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const ownerId = req.user._id
    const {page = 1, limit = 10} = req.query
    const tweets = await Tweet.find({owner:ownerId})
        .sort({createdAt:-1})
        .skip((page-1)*limit)
        .limit(limit)
    return res
    .status(200)
    .json(new ApiResponse(200,tweets,"User tweets fetched sucessfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    const ownerId = req.user._id
    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"Tweet not found")
    }
    if(tweet.owner.toString()!==ownerId.toString()){
        throw new ApiError(403,"You are not authorized to update this tweet")
    }
    if(!content.trim()){
        throw new ApiError(400,"Content must be a valid string")
    }
    tweet.content=content
    await tweet.save()
    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet updated sucessfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    const ownerId = req.user._id
    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"Tweet not found")
    }
    if(tweet.owner.toString()!==ownerId.toString()){
        throw new ApiError(403,"You are not authorized to delete this tweet")
    }
    await tweet.deleteOne()
    return res
    .status(200)
    .json(new ApiResponse(200,null,"Tweet deleted sucessfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}