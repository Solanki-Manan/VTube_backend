import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import redis from "../utils/redis.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    if(!name || !description){
        throw new ApiError(400, "Name and description are required")
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })
    const keys = await redis.keys(`userplaylists:${req.user._id}:*`);
    if (keys.length) {
        await redis.del(keys);
    }
    return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

     const page = parseInt(req.query.page) || 1;
     const limit = parseInt(req.query.limit) || 10;
     const skip = (page - 1) * limit;
     const total = await Playlist.countDocuments({ owner: userId });

    const playlists = await Playlist.find({ owner: userId })
        .populate("videos")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, {
            playlists,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }, "User playlists retrieved successfully")
    );
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId).populate("videos")
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist retrieved successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    //owner check

    // console.log("Playlist owner:", playlist.owner.toString())
    // console.log("Current user ID:", userId.toString())
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this playlist")
    }
    //avoid duplicate videos in playlist
    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "Video already in playlist")
    }
    playlist.videos.push(videoId)

    await redis.del(`playlist:${playlistId}`);
    const keys = await redis.keys(`userplaylists:${req.user._id}:*`);
    if (keys.length) {
        await redis.del(keys);
    }

    await playlist.save()
    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    // console.log("req.user:", req.user)
    // console.log("playlist:", playlist)
    //owner check
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this playlist")
    }
    const videoIndex = playlist.videos.indexOf(videoId)
    if (videoIndex === -1) {
        throw new ApiError(404, "Video not found in playlist")
    }
    
    playlist.videos.splice(videoIndex, 1);

    // ✅ SAVE
    await playlist.save();

    await redis.del(`playlist:${playlistId}`);
    const keys = await redis.keys(`userplaylists:${req.user._id}:*`);
    if (keys.length) {
        await redis.del(keys);
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
        const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    //owner check
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this playlist")
    }
    await Playlist.findByIdAndDelete(playlistId);

    await redis.del(`playlist:${playlistId}`);
    const keys = await redis.keys(`userplaylists:${req.user._id}:*`);
    if (keys.length) {
        await redis.del(keys);
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!name || !description){
        throw new ApiError(400, "Name and description are required")
    }
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not the owner of this playlist")
    }
    playlist.name = name || playlist.name
    playlist.description = description || playlist.description
    await playlist.save()

    await redis.del(`playlist:${playlistId}`);
    const keys = await redis.keys(`userplaylists:${req.user._id}:*`);
    if (keys.length) {
        await redis.del(keys);
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}