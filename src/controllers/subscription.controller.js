import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid ChannelId");
    }

    const subscription = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId,
    });

    if (subscription) {
        await Subscription.findOneAndDelete({
            subscriber: req.user?._id,
            channel: channelId,
        });
        return res.status(200).json({
            success: true,
            message: "Successfully unsubscribed",
        });
    }

    const newSubscription = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
    });

    return res.status(200).json({
        success: true,
        message: "Successfully subscribed",
    });
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    let { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid ChannelId");
    }

    channelId = mongoose.Types.ObjectId(channelId);

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channelId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
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
            $addFields: {
                subscriberCount: $size("$subscribers"),
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid SubscriberId");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: mongoose.Types.ObjectId(subscriberId),
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels",
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
        }
    ]);

    return res
       .status(200)
       .json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
