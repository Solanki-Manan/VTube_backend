import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


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
    const {channelId} = req.params
    const subscribers = await Subscription.find({
        channel:channelId
    }).populate("subscriber","name email")
    return res
    .status(200)
    .json(new ApiResponse(200,subscribers,"Channel subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const subscriptions = await Subscription.find({
        subscriber:subscriberId
    }).populate("channel","name email")
    return res
    .status(200)
    .json(new ApiResponse(200,subscriptions,"Subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}