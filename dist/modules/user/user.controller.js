"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enums_1 = require("../../common/enums");
const response_1 = require("../../common/response");
const services_1 = require("../../common/services");
const multer_1 = require("../../common/utils/multer");
const middleware_1 = require("../../middleware");
const user_authorization_1 = require("./user.authorization");
const user_service_1 = __importDefault(require("./user.service"));
const chat_1 = require("../chat");
const router = (0, express_1.Router)();
router.use("/:userId/chat", chat_1.chatRouter);
router.get("/profile", (0, middleware_1.authentication)(), (0, middleware_1.authorization)(user_authorization_1.endpoint.profile), async (req, res, next) => {
    const data = await user_service_1.default.profile(req.user);
    return (0, response_1.successResponse)({ res, data });
});
router.post("/logout", (0, middleware_1.authentication)(), async (req, res, next) => {
    const data = await user_service_1.default.logout(req.body, req.user, req.decoded);
    return (0, response_1.successResponse)({
        res,
        data,
        message: req.body.flag === 0
            ? "Logged out from all devices successfully"
            : "Logged out from one device successfully",
    });
});
router.post("/rotateToken", (0, middleware_1.authentication)(enums_1.TokenType.REFRESH), async (req, res, next) => {
    const data = await user_service_1.default.rotateToken(req.user, req.decoded, `${req.protocol}://${req.host}`);
    return (0, response_1.successResponse)({
        res,
        message: "Token rotation done",
        data,
    });
});
router.patch("/profile-image", (0, middleware_1.authentication)(), async (req, res, next) => {
    const data = await user_service_1.default.profileImage(req.body, req.user);
    return (0, response_1.successResponse)({ res, data });
});
router.patch("/profile-cover-images", (0, middleware_1.authentication)(), (0, multer_1.cloudFileUpload)({
    storageApproach: enums_1.StorageApproachEnum.MEMORY,
    validation: multer_1.fileFieldValidation.image,
}).array("attachments", 2), async (req, res, next) => {
    const data = await user_service_1.default.profileCoverImages(req.files, req.user);
    return (0, response_1.successResponse)({
        res,
        message: "Updated profile cover images successfully",
        data,
    });
});
router.get("/presigned/*path", async (req, res, next) => {
    const { download, filename } = req.query;
    const { path } = req.params;
    const Key = path.join("/");
    const url = await services_1.s3Service.createPresignedFetchLink({
        Key,
        download,
        filename,
    });
    return (0, response_1.successResponse)({ res, data: { url } });
});
router.delete("/", (0, middleware_1.authentication)(), async (req, res, next) => {
    const data = await user_service_1.default.deleteProfile(req.user);
    (0, response_1.successResponse)({ res, message: "Account deleted successfully", data });
});
exports.default = router;
