import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controller.js";
import cache from "../middlewares/redis.middleware.js";

const router = Router();

router.route("/toggle/:channelId").post(verifyJWT,toggleSubscription)
router.route("/getchannelsubscribers/:channelId").get(
    cache((req) => `channelsubscribers:${req.params.channelId}:${req.query.page || 1}:${req.query.limit || 10}`,300),
    getUserChannelSubscribers)
router.route("/getsubscribedchannels/:subscriberId").get(
    cache((req) => `subscribedchannels:${req.params.subscriberId}:${req.query.page || 1}:${req.query.limit || 10}`,300),
    getSubscribedChannels
)

export default router;