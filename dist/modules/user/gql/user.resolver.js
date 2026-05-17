"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userGQLResolver = exports.UserResolver = void 0;
const middleware_1 = require("../../../middleware");
const user_authorization_1 = require("../../user/user.authorization");
const user_service_1 = __importDefault(require("../user.service"));
const user_valdation_1 = require("../user.valdation");
class UserResolver {
    userService;
    constructor() {
        this.userService = user_service_1.default;
    }
    profile = async (parent, args, { user, decoded }) => {
        (0, middleware_1.GQLAuthorization)(user_authorization_1.endpoint.profile, user);
        await (0, middleware_1.GqlValidation)(user_valdation_1.profileGQLValidation, args);
        const data = await this.userService.profile(user);
        return { message: "User", data };
    };
}
exports.UserResolver = UserResolver;
exports.userGQLResolver = new UserResolver();
