import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controller.js";
const router = Router();

router.route("/toggle/:channelId").post(verifyJWT,toggleSubscription)
router.route("/getchannelsubscribers/:channelId").get(getUserChannelSubscribers)
router.route("/getsubscribedchannels/:subscriberId").get(getSubscribedChannels)

export default router;