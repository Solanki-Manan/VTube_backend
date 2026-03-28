import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, getPlaylistById, getUserPlaylists , removeVideoFromPlaylist, deletePlaylist,updatePlaylist } from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import cache from "../middlewares/redis.middleware.js";
const router = Router()


router.post("/createplaylist", verifyJWT,createPlaylist)
router.get("/getuserplaylists/:userId", 
    cache((req)=>`userplaylists:${req.params.userId}:${req.query.page || 1}:${req.query.limit || 10}`,300),
    getUserPlaylists)
router.get("/getplaylistbyid/:playlistId", 
    cache((req)=>`playlist:${req.params.playlistId}`,300),
    getPlaylistById)
router.post("/:playlistId/addvideo/:videoId",verifyJWT, addVideoToPlaylist)
router.delete("/:playlistId/removevideo/:videoId", verifyJWT,removeVideoFromPlaylist)
router.delete("/deleteplaylist/:playlistId", verifyJWT, deletePlaylist)
router.patch("/updateplaylist/:playlistId", verifyJWT, updatePlaylist)

export default router