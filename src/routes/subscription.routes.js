import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels, getSubscribedChannelsVideos } from "../controllers/subscription.controller.js";
import cache from "../middlewares/redis.middleware.js";

const router = Router();

router.route("/toggle/:channelId").post(verifyJWT,toggleSubscription)
router.route("/getchannelsubscribers/:channelId").get(
    cache((req) => `subscribers_v2:${req.params.channelId}:${req.query.page || 1}:${req.query.limit || 10}`,300),
    getUserChannelSubscribers)
router.route("/getsubscribedchannels/:subscriberId").get(
    cache((req) => `following_v2:${req.params.subscriberId}:${req.query.page || 1}:${req.query.limit || 10}`,300),
    getSubscribedChannels
)
router.route("/videos").get(verifyJWT, getSubscribedChannelsVideos)

export default router;