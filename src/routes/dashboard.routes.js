import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import cache from "../middlewares/redis.middleware.js";
const router = Router()

router.get("/channelstats/:userid", 
    verifyJWT, 
    cache((req)=>`channelstats:${req.params.userid}`,300),
    getChannelStats)
router.get("/channelvideos/:userid", 
    verifyJWT, 
    cache((req)=>`channelvideos:${req.params.userid}:${req.query.page || 1}`,300),
    getChannelVideos)

export default router