import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(`Invalid videoId`);
    }

    const likedStatus = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    });

    if (likedStatus) {
        await Like.findByIdAndDelete(likedStatus._id);
        return res.status(200).json(new ApiResponse(200, "Video unliked"));
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id,
    });

    return res.status(200).json(new ApiResponse(200, "Video liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    // TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(`Invalid commentId`);
    }

    const likedStatus = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    });

    if (likedStatus) {
        await Like.findByIdAndDelete(likedStatus._id);
        return res.status(200).json(new ApiResponse(200, "Comment unliked"));
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
    });

    return res.status(200).json(new ApiResponse(200, "Comment liked"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    // TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(`Invalid tweetId`);
    }

    const likedStatus = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    if (likedStatus) {
        await Like.findByIdAndDelete(likedStatus._id);
        return res.status(200).json(new ApiResponse(200, "Tweet unliked"));
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    return res.status(200).json(new ApiResponse(200, "Tweet liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ],
            },
        },
        {
            $unwind: "$likedVideo",
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                    },
                },
            },
        },
    ]);
    return res.status(200).json(new ApiResponse(200, likedVideos));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
