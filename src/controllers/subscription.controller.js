import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import redis from "../utils/redis.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscriberId = req.user._id
    
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, `Invalid channel ID received: ${channelId}`)
    }

    if(subscriberId.toString() === channelId.toString()){
        throw new ApiError(400,"You cannot subscribe to yourself")
    }
    
    const existingSubscription = await Subscription.findOne({
        subscriber:subscriberId,
        channel:channelId
    })
    const keys1 = await redis.keys(`channelsubscribers:${channelId}:*`);
    if (keys1.length) await redis.del(keys1);

    // clear subscribed channels cache
    const keys2 = await redis.keys(`subscribedchannels:${subscriberId}:*`);
    if (keys2.length) await redis.del(keys2);

    // Clear channel profile cache
    const channelUser = await User.findById(channelId);
    if (channelUser) {
        await redis.del(`channel:${channelUser.username.toLowerCase()}`);
    }

    if(existingSubscription){
        //unsubscribe
        await existingSubscription.deleteOne()
        return res
        .status(200)
        .json(new ApiResponse(200,false,"Unsubscribed successfully"))
    }
    //subscribe
    await Subscription.create({
        subscriber:subscriberId,
        channel:channelId
    })


    return res
    .status(200)
    .json(new ApiResponse(200,true,"Subscribed successfully"))
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Subscription.countDocuments({ channel: channelId });

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "fullName username avatar")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, {
            subscribers,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }, "Channel subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Subscription.countDocuments({ subscriber: subscriberId });

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "fullName username avatar")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, {
            subscriptions,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }, "Subscribed channels fetched successfully")
    );
});

const getSubscribedChannelsVideos = asyncHandler(async (req, res) => {
    const subscriberId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const subscriptions = await Subscription.find({ subscriber: subscriberId }, "channel");
    const channelIds = subscriptions.map(sub => sub.channel);

    if (channelIds.length === 0) {
        return res.status(200).json(new ApiResponse(200, { videos: [], total: 0, page, limit }, "No subscriptions found"));
    }

    // Need to import Video model at the top
    const { Video } = await import("../models/video.model.js");

    const total = await Video.countDocuments({ owner: { $in: channelIds }, ispublished: true });

    const videos = await Video.aggregate([
        {
            $match: {
                owner: { $in: channelIds },
                ispublished: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                thumbnailfile: 1,
                videofile: 1,
                duration: 1,
                ownerDetails: {
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

    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }, "Subscribed channels videos fetched successfully")
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    getSubscribedChannelsVideos
}