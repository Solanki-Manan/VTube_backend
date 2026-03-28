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
        .populate("subscriber", "name email")
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
        .populate("channel", "name email")
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

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}