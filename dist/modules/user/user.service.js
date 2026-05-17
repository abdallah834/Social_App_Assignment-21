"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const config_1 = require("../../common/config/config");
const enums_1 = require("../../common/enums");
const exceptions_1 = require("../../common/exceptions");
const services_1 = require("../../common/services");
const repository_1 = require("../../DB/repository");
const user_repo_1 = require("../../DB/repository/user.repo");
class UserService {
    userRepo;
    redis;
    tokenService;
    s3;
    chatRepo;
    constructor() {
        this.userRepo = new user_repo_1.UserRepo();
        this.tokenService = new services_1.TokenService();
        this.redis = services_1.redisService;
        this.s3 = services_1.s3Service;
        this.chatRepo = new repository_1.ChatRepo();
    }
    async profile(user) {
        const userProfile = await this.userRepo.findOne({
            filter: {
                _id: user._id,
            },
            projection: "username email coverImages firstName lastName friends",
            options: { populate: [{ path: "friends" }] },
        });
        if (!userProfile) {
            throw new exceptions_1.NotFoundException("No user matches this info");
        }
        const groups = await this.chatRepo.find({
            filter: {
                participants: { $in: [user._id] },
                type: enums_1.ChatParticipantsEnum.ovm,
            },
        });
        return { user: userProfile.toJSON(), groups };
    }
    async profileImage({ ContentType, originalName, }, user) {
        const { url } = await this.s3.createPresignedUploadLink({
            path: `Users/${user._id.toString()}/Profile-Image`,
            ContentType,
            originalName,
        });
        return { user, url };
    }
    async profileCoverImages(files, user) {
        const oldUrls = user.coverImages;
        const urls = await this.s3.uploadMultipleAssets({
            files,
            path: `Users/${user._id.toString()}/Profile/CoverImages`,
            storageApproach: enums_1.StorageApproachEnum.DISK,
            uploadApproach: enums_1.UploadApproachEnum.LARGE,
        });
        user.coverImages = urls;
        if (oldUrls?.length) {
            await this.s3.deleteMultipleAssets({
                Keys: oldUrls.map((url) => {
                    return { Key: url };
                }),
            });
        }
        await user.save();
        return user.toJSON();
    }
    async logout({ flag }, user, { jti, iat, sub, }) {
        let statusCode = 200;
        switch (flag) {
            case enums_1.LoggedOutDevices.ALL:
                await this.userRepo.findByIdAndUpdate({
                    _id: user._id,
                    update: { changedCredentialsTime: new Date() },
                });
                await this.redis.redisDelKeys(await this.redis.redisKeys(this.redis.redisBaseRevokeTokenKey(sub)));
                statusCode = 201;
                break;
            default:
                await this.tokenService.createRevokeToken({
                    userId: sub,
                    jti,
                    ttl: iat + Number(config_1.REFRESH_TOKEN_EXPIRATION_TIME),
                });
                statusCode = 201;
                break;
        }
        return statusCode;
    }
    async rotateToken(user, { sub, jti, iat, }, issuer) {
        if (Date.now() - iat * 1000 >= 25 * 60 * 1000) {
            throw new exceptions_1.ConflictException("Current access token is still valid");
        }
        await this.tokenService.createRevokeToken({
            userId: sub,
            jti,
            ttl: Number(iat) + Number(config_1.REFRESH_TOKEN_EXPIRATION_TIME),
        });
        return await this.tokenService.createLoginTokens(user, issuer);
    }
    async deleteProfile(user) {
        const userAccount = await this.userRepo.deleteOne({
            filter: { _id: user._id, force: true },
        });
        if (!userAccount.deletedCount) {
            throw new exceptions_1.NotFoundException("No matching accounts found with this ID");
        }
        await this.s3.deleteFolderByPrefix({
            prefix: `Users/${user.id}`,
        });
        return userAccount;
    }
}
exports.UserService = UserService;
exports.default = new UserService();
