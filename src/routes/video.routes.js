import {Router} from 'express';
import{
    publishVideo,
    getallvideos,
    getvideobyid,
    updatevideo,
    deletevideo
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import  cache  from '../middlewares/redis.middleware.js';
import { authLimiter,apiLimiter } from "../middlewares/ratelimiter.middleware.js";

/**
 * @swagger
 * /api/v1/videos/publish:
 *   post:
 *     summary: Upload and publish a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               videofile:
 *                 type: string
 *                 format: binary
 *               thumbnailfile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       202:
 *         description: Video is being processed
 */

/**
 * @swagger
 * /api/v1/videos/get/{id}:
 *   get:
 *     summary: Get video by ID
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video fetched successfully
 */

/**
 * @swagger
 * /api/v1/videos/all:
 *   get:
 *     summary: Get all videos (paginated)
 *     tags: [Videos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of videos
 */


/**
 * @swagger
 * /api/v1/videos/update/{id}:
 *   put:
 *     summary: Update video details
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video updated successfully
 */


/**
 * @swagger
 * /api/v1/videos/delete/{id}:
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video deleted successfully
 */

const router = Router();
router.route("/publish").post(verifyJWT,upload.fields([
    {
        name: "videofile",
        maxCount: 1
    },
    {
        name: "thumbnailfile",
        maxCount: 1
    }
]),apiLimiter, publishVideo )   

router.route("/all").get(getallvideos)

router.route("/get/:id").get(getvideobyid)
router.route("/update/:id").put(verifyJWT,updatevideo)
router.route("/delete/:id").delete(verifyJWT,deletevideo)



export default router;