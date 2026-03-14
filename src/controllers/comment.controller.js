import { ApiError } from "../utils/ApiError.js";
import {Video} from "../models/video.model.js"
import { response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const ownerId=req.user;
    const videoId=req.params;
    const content=req.body;

    if(!videoId){
        throw new ApiError(404,"Invalid video link")
    }
    if(!content?.trim()){
        throw new ApiError(400,"No content")
    }

    const video=Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"There is no video")
    }

    const comment =await Comment.create({
        content,
        video:videoId,
        owner:ownerId
    });

    return res.status(200).json(
        new ApiResponse(200,comment,"Comment Added Sucessfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    //const content=
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})


export {
    addComment,
    updateComment,
    deleteComment

}