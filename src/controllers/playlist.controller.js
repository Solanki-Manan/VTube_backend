import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


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
    return res
    .status(201)
    .json(new ApiResponse(true, "Playlist created successfully", playlist))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }
    const playlists = await Playlist.find({owner: userId}).populate("videos")
    return res
    .status(200)
    .json(new ApiResponse(true, "User playlists retrieved successfully", playlists))
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
    .json(new ApiResponse(true, "Playlist retrieved successfully", playlist))
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
    await playlist.save()
    return res
    .status(200)
    .json(new ApiResponse(true, "Video added to playlist successfully", playlist))
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

    return res
    .status(200)
    .json(new ApiResponse(true, "Video removed from playlist successfully", playlist))

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
    return res
    .status(200)
    .json(new ApiResponse(true, "Playlist deleted successfully"))
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
    return res
    .status(200)
    .json(new ApiResponse(true, "Playlist updated successfully", playlist))
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