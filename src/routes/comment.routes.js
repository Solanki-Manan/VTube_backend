import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoComments,addComment, updateComment,deleteComment } from "../controllers/comment.controller.js";
import cache from "../middlewares/redis.middleware.js";
import { authLimiter,apiLimiter } from "../middlewares/ratelimiter.middleware.js";
const router = Router();


//router.route("/:videoId").get(getVideoComments)

router.route("/getcomments/:videoId").get(getVideoComments)
router.route("/addcomment/:videoId").post(verifyJWT,apiLimiter,addComment)
router.route("/updatecomment/:commentId").put(verifyJWT,updateComment)
router.route("/deletecomment/:commentId").delete(verifyJWT,deleteComment)


export default router;