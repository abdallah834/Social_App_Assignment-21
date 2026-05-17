"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
const postSchema = new mongoose_1.Schema({
    folderId: { type: String, required: true },
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: { type: [String], default: [] },
    availability: {
        type: Number,
        enum: enums_1.AvailabilityEnum,
        default: enums_1.AvailabilityEnum.PUBLIC,
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
    updatedBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    collection: "Posts",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
postSchema.virtual("comments", {
    localField: "_id",
    foreignField: "postId",
    ref: "Comment",
    justOne: true,
});
postSchema.pre("updateOne", { document: true }, function () { });
postSchema.pre("deleteOne", { document: true }, function () { });
postSchema.pre("insertMany", function (docs) {
});
postSchema.post("insertMany", function (docs) {
});
postSchema.pre(["findOne", "find", "countDocuments"], function () {
    const query = this.getFilter();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    this.setQuery({ ...query, deletedAt: { $exists: false } });
});
postSchema.pre(["updateOne", "findOneAndUpdate"], function () {
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
postSchema.pre(["deleteOne", "findOneAndDelete"], function () {
    const query = this.getFilter();
    if (query.force) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: true }, ...query });
    }
});
exports.postModel = mongoose_1.models.Post || (0, mongoose_1.model)("Post", postSchema);
