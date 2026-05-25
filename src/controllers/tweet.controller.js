import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import redis from "../utils/redis.js"
import jwt from "jsonwebtoken"
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
        const keys = await redis.keys(`usertweets:${req.user._id}:*`);
        if (keys.length) await redis.del(keys);

        return res
        .status(200)
        .json(new ApiResponse(200,true,"Tweet created sucessfully"))
    } catch (error) {
        throw new ApiError(500,"Error while creating tweet")
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
        try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            req.user = { _id: new mongoose.Types.ObjectId(decodedToken._id) };
        } catch(err) {}
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                totalLikes: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [req.user ? req.user._id : null, "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                totalLikes: 1,
                isLiked: 1,
                owner: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1
                }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ]);

    const totalTweets = await Tweet.countDocuments({ owner: userId });

    return res
    .status(200)
    .json(new ApiResponse(200, {
        tweets,
        page,
        limit,
        total: totalTweets,
        totalPages: Math.ceil(totalTweets / limit)
    }, "User tweets fetched successfully"));
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
    const keys = await redis.keys(`usertweets:${req.user._id}:*`);
    if (keys.length) await redis.del(keys);

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
    const keys = await redis.keys(`usertweets:${req.user._id}:*`);
    if (keys.length) await redis.del(keys);

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