import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comments.model.js";
import redis from "../utils/redis.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
        try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            req.user = { _id: new mongoose.Types.ObjectId(decodedToken._id) };
        } catch(err) {
            // Ignore optional auth
        }
    }

    if(!videoId){
        throw new ApiError(404,"Invalid video link")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"There is no video")
    }
    const skip = (page - 1) * limit;

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [req.user ? req.user._id : null, "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                isLiked: 1,
                owner: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1
                }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ]);
    return res.status(200).json(
        new ApiResponse(200,comments,"Comments fetched sucessfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const ownerId = req.user._id;
  const {videoId} = req.params;
  const {content} = req.body;

  if (!videoId) {
    throw new ApiError(404, "Invalid video link");
  }
  if (!content.trim()) {
    throw new ApiError(400, "Content must be a valid string");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "There is no video");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: ownerId,
  });
  const keys = await redis.keys(`comments:${videoId}:*`);
  if (keys.length) {
      await redis.del(keys);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Added Sucessfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  //const content=
  const { commentId } = req.params;
  const {content} = req.body;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not the owner of this comment");
  }
  comment.content = content;
  await comment.save();
  const keys = await redis.keys(`comments:${comment.video}:*`);
  if (keys.length) {
      await redis.del(keys);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Updated Sucessfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not the owner of this comment");
  }
  await comment.deleteOne();
  const keys = await redis.keys(`comments:${comment.video}:*`);
  if (keys.length) {
      await redis.del(keys);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment Deleted Sucessfully"));
});

export { getVideoComments,addComment, updateComment, deleteComment };
