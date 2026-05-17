"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../../config/config");
const exceptions_1 = require("../../exceptions");
const enums_1 = require("../../enums");
class RedisService {
    client;
    constructor() {
        this.client = new ioredis_1.default(config_1.REDIS_URL);
        this.handleEvents();
    }
    async connect() {
        console.log("Redis connected successfully");
    }
    handleEvents() {
        this.client.on("error", (err) => console.error("Redis error:", err));
        this.client.on("ready", () => console.error("Redis is ready to use"));
    }
    async redisSet({ key, value, ttl, }) {
        try {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            return ttl
                ? await this.client.set(key, data, "EX", ttl)
                : await this.client.set(key, data);
        }
        catch (error) {
            throw new exceptions_1.internalServerError("Something went wrong with setting the value within redis");
        }
    }
    async redisUpdate({ key, value, ttl, }) {
        try {
            if (!(await this.client.exists(key))) {
                return 0;
            }
            return await this.redisSet({ key, value, ttl });
        }
        catch (error) {
            throw new exceptions_1.internalServerError("Something went wrong with updating the value within redis");
        }
    }
    async redisGet(key) {
        try {
            try {
                const opResult = await this.client.get(key);
                if (!opResult) {
                    return null;
                }
                return JSON.parse(opResult);
            }
            catch (error) {
                return await this.client.get(key);
            }
        }
        catch (error) {
            throw new exceptions_1.internalServerError("Something went wrong with getting the value within redis");
        }
    }
    async redisGetTtl(key) {
        try {
            if (!(await this.client.ttl(key))) {
                throw new exceptions_1.NotFoundException("The value you are trying to have a ttl enabled");
            }
            return this.client.ttl(key);
        }
        catch (error) {
            throw new exceptions_1.internalServerError("Something went wrong with getting the ttl value within redis");
        }
    }
    async redisCheckKey(key) {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            throw new exceptions_1.internalServerError("Key doesn't exist");
        }
    }
    async redisAddTtl({ key, ttl, }) {
        try {
            return await this.client.expire(key, ttl);
        }
        catch (error) {
            throw new exceptions_1.internalServerError("Failed to add ttl to the key");
        }
    }
    async redisMGet(keys) {
        try {
            if (!keys.length) {
                return 0;
            }
            return await this.client.mget(...keys);
        }
        catch (error) {
            throw new exceptions_1.internalServerError("Failed to get all of the specified keys");
        }
    }
    async redisKeys(prefix) {
        try {
            return await this.client.keys(`${prefix}*`);
        }
        catch (error) {
            throw new exceptions_1.internalServerError("Failed to get keys");
        }
    }
    async redisDelKeys(keys) {
        try {
            if (!keys.length)
                return 0;
            return await this.client.del(keys);
        }
        catch (error) {
            throw new exceptions_1.internalServerError("Failed to delete keys");
        }
    }
    async redisIncrKey(key) {
        try {
            if (!(await this.client.exists(key)))
                return 0;
            return await this.client.incr(key);
        }
        catch (error) {
            throw new exceptions_1.internalServerError("Failed to increment keys");
        }
    }
    redisBaseRevokeTokenKey(userId) {
        if (!userId) {
            throw new exceptions_1.internalServerError("No user Id found");
        }
        return `RevokeToken::${userId.toString()}`;
    }
    redisRevokeTokenKey({ userId, jti, }) {
        return `${this.redisBaseRevokeTokenKey(userId)}::${jti}`;
    }
    otpKey(email, { type = enums_1.EmailEnum.CONFIRM_EMAIL } = {}) {
        return `OTP::User::${email}::${type}`;
    }
    maxOtpRequestsKey(email, { type = enums_1.EmailEnum.CONFIRM_EMAIL } = {}) {
        return `${this.otpKey(email, { type })}::Request`;
    }
    otpBlockKey(email, { type = enums_1.EmailEnum.CONFIRM_EMAIL } = {}) {
        return `${this.otpKey(email, { type })}::Block::Request`;
    }
    generalLoginAttemptBlock() {
        return `OTP::Block::Request`;
    }
    otp2FAVerification(email) {
        return `OTP::Verification::Token::${email}`;
    }
    unverifiedAccountDuration(email) {
        return `User::AccountTTL::${email}`;
    }
    FCM_key(userId) {
        return `user:FCM:${userId}`;
    }
    async addFCM(userId, FCMToken) {
        return await this.client.sadd(this.FCM_key(userId), FCMToken);
    }
    async removeFCM(userId, FCMToken) {
        return await this.client.srem(this.FCM_key(userId), FCMToken);
    }
    async getFCMs(userId) {
        return await this.client.smembers(this.FCM_key(userId));
    }
    async hasFCMs(userId) {
        return await this.client.scard(this.FCM_key(userId));
    }
    async removeFCMUser(userId) {
        return await this.client.del(this.FCM_key(userId));
    }
    socketKey(userId) {
        return `user:sockets:${userId.toString()}`;
    }
    async addSocket(userId, socketId) {
        return await this.client.sadd(this.socketKey(userId), socketId);
    }
    async removeSocket(userId, socketId) {
        return await this.client.srem(this.socketKey(userId), socketId);
    }
    async getSockets(userId) {
        return await this.client.smembers(this.socketKey(userId));
    }
    async hasSockets(userId) {
        return await this.client.scard(this.socketKey(userId));
    }
    async removeUserSockets(userId) {
        return await this.client.del(this.socketKey(userId));
    }
}
exports.RedisService = RedisService;
exports.redisService = new RedisService();
