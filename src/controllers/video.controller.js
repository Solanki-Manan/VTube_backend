import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {v2 as cloudinary} from "cloudinary"
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";


const publishVideo = asyncHandler(async (req, res) => {
    //console.log("REQ BODY =", req.body)       //  add this----e bhale ha
    //console.log("REQ FILES =", req.files)     //  add this----ho
    const { title, description } = req.body


    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required")
    }
    const videolocalPath = req.files?.videofile?.[0]?.path
    const thumbnaillocalPath = req.files?.thumbnailfile?.[0]?.path
    if(!videolocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    if(!thumbnaillocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const videofile=await uploadOnCloudinary(videolocalPath)
    const thumbnailfile=await uploadOnCloudinary(thumbnaillocalPath)
    if(!videofile) {
        throw new ApiError(500, "Video upload failed")
    }
    if(!thumbnailfile) {
        throw new ApiError(500, "Thumbnail upload failed")
    }

    const video = await Video.create({
        title,
        description,
        videofile: videofile.secure_url,
        videofilepublicid: videofile.public_id,
        thumbnailfile: thumbnailfile.secure_url,
        thumbnailpublicid: thumbnailfile.public_id,
        duration: videofile.duration,
        owner: req.user._id,
        ispublished: true
    })

    if(!video) {
        throw new ApiError(500, "Failed to publish video")
    }

    return res
    .status(201)
    .json(new ApiResponse(201,true, "Video published successfully"))

})

const getallvideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({ ispublished: true })
        .populate("owner", "fullname username email avatar")
    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})


const getvideobyid = asyncHandler(async (req, res) => {
        const { id } = req.params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid video ID")
        }
        const video = await Video.findById(id)
        if (!video) {
            throw new ApiError(404, "Video not found")
        }
        video.views += 1
        await video.save()
        return res
            .status(200)
            .json(new ApiResponse(200, true, "Video fetched by your given id"))
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

        console.log("Video Public ID:", video.videofilepublicid)
        console.log("Thumbnail Public ID:", video.thumbnailpublicid)

        await cloudinary.uploader.destroy(video.videofilepublicid, {
        resource_type: "video"
        })

        await cloudinary.uploader.destroy(video.thumbnailpublicid)

        await video.deleteOne()

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