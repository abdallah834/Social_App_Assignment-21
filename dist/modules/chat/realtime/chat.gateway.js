"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatGateway = exports.ChatGateway = void 0;
const chat_events_1 = require("./chat.events");
class ChatGateway {
    chatEvents;
    constructor() {
        this.chatEvents = chat_events_1.chatEvents;
    }
    registerEvents = (socket, io) => {
        this.chatEvents.sayHi(socket, io);
        this.chatEvents.sendMessageEvent(socket, io);
        this.chatEvents.sendGroupMessageEvent(socket, io);
        this.chatEvents.joinRoom(socket, io);
    };
}
exports.ChatGateway = ChatGateway;
exports.chatGateway = new ChatGateway();
