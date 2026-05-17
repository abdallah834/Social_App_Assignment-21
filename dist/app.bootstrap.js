"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_2 = require("graphql-http/lib/use/express");
const config_1 = require("./common/config/config");
const redis_1 = require("./common/services/redis");
const db_connections_1 = require("./DB/db.connections");
const middleware_1 = require("./middleware");
const modules_1 = require("./modules");
const comment_1 = require("./modules/comment");
const user_1 = require("./modules/user");
const chat_1 = require("./modules/chat");
const bootstrap = async () => {
    const app = (0, express_1.default)();
    await (0, db_connections_1.mongoDBConnection)();
    await redis_1.redisService.connect();
    app.use((0, cors_1.default)(), express_1.default.json());
    app.all("/graphql", (0, middleware_1.authentication)(), (0, express_2.createHandler)({
        schema: modules_1.gqlSchema,
        context: (req) => ({
            user: req.raw.user,
            decodedToken: req.raw.decoded,
        }),
    }));
    app.use("/auth", modules_1.authRouter);
    app.use("/user", user_1.userRouter);
    app.use("/post", modules_1.postRouter);
    app.use("/comment", comment_1.commentRouter);
    app.use("/chat", chat_1.chatRouter);
    app.use("/*dummy", (req, res, next) => {
        return res.status(404).json({ Error: "Invalid route" });
    });
    app.get("/", (req, res, next) => {
        res.status(200).json({ Success: "Landing page" });
    });
    app.use(middleware_1.globalErrorHandler);
    const httpServer = app.listen(config_1.PORT, (err) => {
        try {
            console.log("app is running on port 3100");
        }
        catch (error) {
            console.error(err);
        }
    });
    modules_1.realtimeGateway.initializeIo(httpServer);
};
exports.bootstrap = bootstrap;
