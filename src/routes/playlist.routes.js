import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, getPlaylistById, getUserPlaylists , removeVideoFromPlaylist, deletePlaylist,updatePlaylist } from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.post("/createplaylist", verifyJWT,createPlaylist)
router.get("/getuserplaylists/:userId", getUserPlaylists)
router.get("/getplaylistbyid/:playlistId", getPlaylistById)
router.post("/:playlistId/addvideo/:videoId",verifyJWT, addVideoToPlaylist)
router.delete("/:playlistId/removevideo/:videoId", verifyJWT,removeVideoFromPlaylist)
router.delete("/deleteplaylist/:playlistId", verifyJWT, deletePlaylist)
router.patch("/updateplaylist/:playlistId", verifyJWT, updatePlaylist)

export default router