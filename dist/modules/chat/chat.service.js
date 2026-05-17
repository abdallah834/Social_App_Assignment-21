"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const s3_service_1 = require("./../../common/services/aws-sdk/s3.service");
const mongoose_1 = require("mongoose");
const repository_1 = require("../../DB/repository");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const node_crypto_1 = require("node:crypto");
class ChatService {
    chatRepo;
    userRepo;
    s3Service;
    constructor() {
        this.chatRepo = new repository_1.ChatRepo();
        this.userRepo = new repository_1.UserRepo();
        this.s3Service = s3_service_1.s3Service;
    }
    sayHi = () => {
        return "Hi";
    };
    async getChat(participantId, { page, size }, user) {
        const chat = await this.chatRepo.findOneChat({
            filter: {
                participants: {
                    $all: [user._id, mongoose_1.Types.ObjectId.createFromHexString(participantId)],
                },
                type: enums_1.ChatParticipantsEnum.ovo,
            },
            options: {
                populate: [{ path: "participants" }],
            },
            page,
            size,
        });
        if (!chat) {
            throw new exceptions_1.NotFoundException("There are no chats between you and this user");
        }
        return chat.toJSON();
    }
    sendMessage = async ({ content, sendTo }, user) => {
        let chat = await this.chatRepo.findOneAndUpdate({
            filter: {
                participants: {
                    $all: [user._id, mongoose_1.Types.ObjectId.createFromHexString(sendTo)],
                },
                type: enums_1.ChatParticipantsEnum.ovo,
            },
            update: {
                $addToSet: {
                    messages: {
                        content,
                        createdBy: user._id,
                    },
                },
            },
        });
        if (!chat) {
            await this.chatRepo.createOne({
                data: {
                    participants: [user._id, mongoose_1.Types.ObjectId.createFromHexString(sendTo)],
                    createdBy: user._id,
                    type: enums_1.ChatParticipantsEnum.ovo,
                    messages: [
                        {
                            content,
                            createdBy: user._id,
                        },
                    ],
                },
            });
        }
    };
    async createGroupChat({ participantIds, groupName, }, user, file) {
        const participantObjectIds = [
            ...new Set(participantIds.map((id) => mongoose_1.Types.ObjectId.createFromHexString(id))),
        ];
        const checkExistingParticipants = await this.userRepo.find({
            filter: {
                _id: { $in: participantObjectIds },
                friends: { $in: [user._id] },
            },
        });
        if (checkExistingParticipants.length != participantObjectIds.length) {
            throw new exceptions_1.NotFoundException("Failed to find all participants");
        }
        let groupImage = undefined;
        const roomId = (0, node_crypto_1.randomUUID)();
        const path = `Chat/group/${roomId}`;
        if (file) {
            groupImage = await this.s3Service.uploadAsset({ file, path });
        }
        const groupChat = await this.chatRepo.createOne({
            data: {
                participants: [...participantIds, user._id],
                createdBy: user._id,
                messages: [],
                type: enums_1.ChatParticipantsEnum.ovm,
                roomId,
                groupName,
                groupImage,
            },
        });
        return groupChat.toJSON();
    }
    async getGroupChat(groupId, { page, size }, user) {
        const chat = await this.chatRepo.findOneChat({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                participants: {
                    $all: [user._id],
                },
                type: enums_1.ChatParticipantsEnum.ovm,
            },
            options: {
                populate: [{ path: "participants" }, { path: "messages.createdBy" }],
            },
            page,
            size,
        });
        if (!chat) {
            throw new exceptions_1.NotFoundException("There are no chats between you and this user");
        }
        return chat.toJSON();
    }
    async sendGroupMessage({ content, groupId }, user) {
        let chat = await this.chatRepo.findOneAndUpdate({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                participants: { $in: [user._id] },
                type: enums_1.ChatParticipantsEnum.ovm,
            },
            update: { $addToSet: { messages: { content, createdBy: user._id } } },
        });
        if (!chat) {
            throw new exceptions_1.NotFoundException("No group chat messages were found");
        }
        return chat.roomId;
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
