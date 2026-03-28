import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoComments,addComment, updateComment,deleteComment } from "../controllers/comment.controller.js";
import cache from "../middlewares/redis.middleware.js";

const router = Router();


//router.route("/:videoId").get(getVideoComments)

router.route("/getcomments/:videoId").get(
    cache((req)=>`comments:${req.params.videoId}:{req.query.page || 1}:{req.query.limit || 10}`,300),
    getVideoComments)
router.route("/addcomment/:videoId").post(verifyJWT,addComment)
router.route("/updatecomment/:commentId").put(verifyJWT,updateComment)
router.route("/deletecomment/:commentId").delete(verifyJWT,deleteComment)


export default router;