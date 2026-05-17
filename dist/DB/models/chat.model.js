"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
const messageSchema = new mongoose_1.Schema({
    attachments: {
        type: [String],
        default: [],
        required: function () {
            return !this.content;
        },
    },
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        },
    },
    likes: {
        type: [{ user: mongoose_1.Types.ObjectId, react: Number }],
        ref: "User",
        default: [],
        _id: false,
        unique: true,
    },
    tags: { type: [{ type: mongoose_1.Types.ObjectId }], ref: "User", default: [] },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "User" },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
});
const chatSchema = new mongoose_1.Schema({
    participants: [{ type: mongoose_1.Types.ObjectId, ref: "User", required: true }],
    messages: { type: [messageSchema], required: true },
    type: {
        type: String,
        enum: enums_1.ChatParticipantsEnum,
        default: enums_1.ChatParticipantsEnum.ovo,
    },
    groupName: {
        type: String,
        required: function () {
            return this.type === enums_1.ChatParticipantsEnum.ovm;
        },
    },
    groupImage: {
        type: String,
    },
    roomId: {
        type: String,
        required: function () {
            return this.type === enums_1.ChatParticipantsEnum.ovm;
        },
    },
    createdBy: { type: mongoose_1.Types.ObjectId, required: true, ref: "User" },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    collection: "Chats",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
chatSchema.pre("updateOne", { document: true }, function () { });
chatSchema.pre("deleteOne", { document: true }, function () { });
chatSchema.pre("insertMany", function (docs) {
});
chatSchema.post("insertMany", function (docs) {
});
chatSchema.pre(["findOne", "find", "countDocuments"], function () {
    const query = this.getFilter();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    this.setQuery({ ...query, deletedAt: { $exists: false } });
});
chatSchema.pre(["updateOne", "findOneAndUpdate"], function () {
    const updateQuery = this.getUpdate();
    if (Array.isArray(updateQuery))
        return;
    if (updateQuery.deletedAt) {
        this.setUpdate({ ...updateQuery, $unset: { restoredAt: 1 } });
    }
    if (updateQuery.restoredAt) {
        this.setUpdate({ ...updateQuery, $unset: { deletedAt: 1 } });
        this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
    }
    const query = this.getFilter();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: false }, ...query });
    }
});
chatSchema.pre(["deleteOne", "findOneAndDelete"], function () {
    const query = this.getFilter();
    if (query.force) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: true }, ...query });
    }
});
exports.chatModel = mongoose_1.models.Chat || (0, mongoose_1.model)("Chat", chatSchema);
