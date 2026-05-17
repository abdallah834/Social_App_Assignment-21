"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sayHi = void 0;
const zod_1 = __importDefault(require("zod"));
exports.sayHi = zod_1.default.strictObject({
    name: zod_1.default.string().min(2),
});
