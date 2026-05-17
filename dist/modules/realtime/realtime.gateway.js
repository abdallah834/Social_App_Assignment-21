"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeGateway = exports.RealtimeGateWay = void 0;
const socket_io_1 = require("socket.io");
const services_1 = require("../../common/services");
const chat_1 = require("../chat");
class RealtimeGateWay {
    io;
    tokenService;
    redisService;
    constructor() {
        this.tokenService = new services_1.TokenService();
        this.redisService = services_1.redisService;
    }
    socketAuthentication = async (socket, next) => {
        try {
            const { userAccount, decodedToken } = await this.tokenService.decodeToken({
                token: socket.handshake.auth.authorization ||
                    socket.handshake.headers.authorization,
            });
            socket.data = { userAccount, decodedToken };
            await this.redisService.addSocket(userAccount._id, socket.id);
            next();
        }
        catch (error) {
            next(error);
        }
    };
    initializeIo = (httpServer) => {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: [
                    "http://localhost:5500",
                    "http://localhost:3000",
                    "http://127.0.0.1:5500",
                ],
            },
        });
        this.io.use(this.socketAuthentication);
        this.io.on("connection", async (socket) => {
            chat_1.chatGateway.registerEvents(socket, this.io);
            socket.on("sayHi", (data, callback) => {
            });
            socket.on("disconnect", async () => {
                await this.redisService.removeSocket(socket.data.user._id, socket.id);
                const connections = (await this.redisService.getSockets(socket.data.user._id)) || [];
                if (connections.length < 1) {
                    this.io.emit("user_offline", {
                        userId: socket.data.user._id,
                        status: "Offline",
                    });
                }
            });
        });
    };
    getIo = () => this.io;
}
exports.RealtimeGateWay = RealtimeGateWay;
exports.realtimeGateway = new RealtimeGateWay();
