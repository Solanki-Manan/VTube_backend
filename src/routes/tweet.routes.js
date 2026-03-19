import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTweets, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";
const router = Router();

router.route("/createtweet").post(verifyJWT,createTweet)
router.route("/getusertweets").get(verifyJWT,getUserTweets)
router.route("/updatetweet/:tweetId").put(verifyJWT,updateTweet)
router.route("/deletetweet/:tweetId").delete(verifyJWT,deleteTweet)

export default router;