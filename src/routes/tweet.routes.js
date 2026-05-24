import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTweets, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";
import { authLimiter,apiLimiter } from "../middlewares/ratelimiter.middleware.js";
import  cache  from "../middlewares/redis.middleware.js";
const router = Router();


router.route("/createtweet").post(verifyJWT,apiLimiter,createTweet)
router.route("/getusertweets/:userId").get(
    cache((req)=>`usertweets:${req.params.userId}:${req.query.page || 1}:${req.query.limit || 10}`,300),
    getUserTweets)
router.route("/updatetweet/:tweetId").put(verifyJWT,updateTweet)
router.route("/deletetweet/:tweetId").delete(verifyJWT,deleteTweet)

export default router;