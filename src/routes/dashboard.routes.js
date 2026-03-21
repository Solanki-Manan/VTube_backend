import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.get("/channelstats/:userid", verifyJWT, getChannelStats)
router.get("/channelvideos/:userid", verifyJWT, getChannelVideos)

export default router