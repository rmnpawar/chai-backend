import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id;

    const subscribersCount = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $group: {
                _id: null,
                subscribersCount: {
                    $sum: 1
                }
            }
        }
    ]);

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $project: {
                totalLikes: {
                    $size: "$likes"
                },
                totalViews: "$views",
                totalVideos: 1
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: {
                    $sum: "$totalLikes"
                },
                totalViews: {
                    $sum: "$totalViews"
                },
                totalVideos: {
                    $sum: 1
                }
            }
        }
    ]);

    const stats = {
        subscribersCount: subscribersCount[0]?.subscribersCount || 0,
        likesCount: videos[0]?.totalLikes || 0,
        viewsCount: videos[0]?.totalViews || 0,
        videosCount: videos[0]?.totalVideos || 0,
    };

    return res
       .status(200)
       .json(new ApiResponse(200, stats, "Channel stats loaded successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes",
                },
                createdAt: {
                    $dateToParts: { date: "$createdAt" },
                },
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                _id: 1,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                views: 1,
                duration: 1,
                createdAt: {
                    year: 1,
                    month: 1,
                    day: 1,
                },
                isPublished: 1,
                likesCount: 1,
            },
        },
    ]);

    return res.status(200).json(ApiResponse.success(200, videos, "User Videos"));
});

export { getChannelStats, getChannelVideos };
