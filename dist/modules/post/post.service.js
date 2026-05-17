"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = void 0;
const mongoose_1 = require("mongoose");
const node_crypto_1 = require("node:crypto");
const enums_1 = require("../../common/enums");
const exceptions_1 = require("../../common/exceptions");
const services_1 = require("../../common/services");
const post_1 = require("../../common/utils/post");
const repository_1 = require("../../DB/repository");
const s3_service_1 = require("./../../common/services/aws-sdk/s3.service");
const realtime_1 = require("../realtime");
class PostService {
    populate = [
        {
            path: "likes",
        },
        {
            path: "tags",
        },
        {
            path: "createdBy",
        },
        {
            path: "comments",
            populate: [{ path: "replies", populate: [{ path: "reply" }] }],
        },
    ];
    userRepo;
    redis;
    notification;
    postRepo;
    s3;
    realTime;
    constructor() {
        this.userRepo = new repository_1.UserRepo();
        this.redis = services_1.redisService;
        this.postRepo = new repository_1.PostRepo();
        this.notification = services_1.notificationService;
        this.s3 = s3_service_1.s3Service;
        this.realTime = realtime_1.realtimeGateway;
    }
    async createPost({ availability, content, files, tags }, user) {
        const mentions = [];
        const fcmTokens = [];
        if (tags?.length) {
            const mentionedAccounts = await this.userRepo.find({
                filter: { _id: { $in: tags } },
            });
            if (mentionedAccounts.length !== tags.length) {
                throw new exceptions_1.NotFoundException("Couldn't find mentioned user accounts");
            }
            tags.map(async (tag) => {
                mentions.push(mongoose_1.Types.ObjectId.createFromHexString(tag));
                ((await this.redis.getFCMs(tag)) || []).map((token) => {
                    fcmTokens.push(token);
                });
            });
            console.log({ mentions, fcmTokens });
        }
        const folderId = (0, node_crypto_1.randomUUID)();
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadMultipleAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const post = await this.postRepo.createOne({
            data: {
                createdBy: user._id,
                content,
                attachments,
                folderId,
                availability,
                tags: mentions,
            },
        });
        if (!post) {
            if (attachments?.length) {
                await this.s3.deleteMultipleAssets({
                    Keys: attachments.map((attachment) => {
                        return { Key: attachment };
                    }),
                });
            }
            throw new exceptions_1.BadRequestException("Failed to create post");
        }
        if (fcmTokens.length) {
            await this.notification.sendMultipleNotifications({
                data: {
                    title: "Post mention",
                    body: JSON.stringify({
                        message: `${user.username} mentioned you in a recent post`,
                        postId: post._id,
                    }),
                },
                tokens: fcmTokens,
            });
        }
        return post.toJSON();
    }
    async updatePost({ postId }, { availability, content, files, tags, removeFiles, removeTags, }, user) {
        const post = await this.postRepo.findOne({
            filter: {
                _id: postId,
                createdBy: user._id,
            },
        });
        if (!post) {
            throw new exceptions_1.NotFoundException("Failed to find posts for this user");
        }
        if (!content &&
            !post?.content &&
            !files?.length &&
            (removeFiles?.length ?? 0) >= (post.attachments?.length ?? 0)) {
            throw new exceptions_1.BadRequestException("Posts can't be empty");
        }
        const mentions = [];
        const fcmTokens = [];
        if (tags?.length) {
            const mentionedAccounts = await this.userRepo.find({
                filter: { _id: { $in: tags } },
            });
            if (mentionedAccounts.length !== tags.length) {
                throw new exceptions_1.NotFoundException("Couldn't find mentioned user accounts");
            }
            if (tags.length) {
                await Promise.all(tags.map(async (tag) => {
                    mentions.push(mongoose_1.Types.ObjectId.createFromHexString(tag));
                    ((await this.redis.getFCMs(tag)) || []).forEach((token) => {
                        fcmTokens.push(token);
                    });
                }));
            }
        }
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadMultipleAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const updatedPost = await this.postRepo.findOneAndUpdate({
            filter: { _id: postId, createdBy: user._id },
            update: [
                {
                    $set: {
                        content: content ?? post.content,
                        availability: Number(availability ?? post.availability),
                        folderId,
                        attachments: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        { $ifNull: ["$attachments", []] },
                                        removeFiles ?? [],
                                    ],
                                },
                                attachments,
                            ],
                        },
                        tags: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "$tags",
                                        (removeTags ?? []).map((tag) => mongoose_1.Types.ObjectId.createFromHexString(tag)),
                                    ],
                                },
                                mentions.map((id) => id),
                            ],
                        },
                    },
                },
            ],
        });
        if (!updatedPost) {
            if (attachments?.length) {
                await this.s3.deleteMultipleAssets({
                    Keys: attachments.map((attachment) => {
                        return { Key: attachment };
                    }),
                });
            }
            throw new exceptions_1.BadRequestException("Failed to create post");
        }
        if (removeFiles?.length) {
            await this.s3.deleteMultipleAssets({
                Keys: removeFiles.map((file) => {
                    return { Key: file };
                }),
            });
        }
        if (fcmTokens.length) {
            await this.notification.sendMultipleNotifications({
                data: {
                    title: "Post mention",
                    body: JSON.stringify({
                        message: `${user.username} mentioned you in a recent post`,
                        postId: post,
                    }),
                },
                tokens: fcmTokens,
            });
        }
        return updatedPost.toJSON();
    }
    async allPosts({ limit, search, page }, user) {
        const posts = await this.postRepo.paginate({
            filter: {
                $or: (0, post_1.getPostsAvailability)(user),
                ...(search?.length
                    ?
                        { content: { $regex: search, $options: "i" } }
                    : {}),
            },
            page,
            limit,
            options: {
                populate: this.populate,
            },
        });
        return posts;
    }
    async reactToPost({ postId }, { react }, user) {
        const reactAsNumber = Number(react);
        console.log(user);
        const post = await this.postRepo.findOneAndUpdate({
            filter: { _id: postId, $or: (0, post_1.getPostsAvailability)(user) },
            update: {
                ...(reactAsNumber > enums_1.ReactEnums.REMOVE_LIKE
                    ? { $addToSet: { likes: user._id } }
                    : { $pull: { likes: user._id } }),
            },
            populate: this.populate,
        });
        if (!post) {
            throw new exceptions_1.NotFoundException("You are not eligible to like this user's post");
        }
        const postOwner = post.createdBy;
        const socketIds = await this.redis.getSockets(postOwner._id);
        if (socketIds.length || reactAsNumber > 1) {
            this.realTime
                .getIo()
                .to(socketIds)
                .emit("likePost", { postId, userId: user._id, reactAsNumber });
        }
        return post.toJSON();
    }
}
exports.PostService = PostService;
exports.postService = new PostService();
