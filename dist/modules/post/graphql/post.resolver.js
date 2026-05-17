"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postResolver = exports.PostResolver = void 0;
const validation_1 = require("../../../common/validation");
const middleware_1 = require("../../../middleware");
const user_authorization_1 = require("../../user/user.authorization");
const post_service_1 = require("../post.service");
const post_validation_1 = require("../post.validation");
class PostResolver {
    postService;
    constructor() {
        this.postService = post_service_1.postService;
    }
    listPosts = async (parent, args, { user, decoded }) => {
        (0, middleware_1.GQLAuthorization)(user_authorization_1.endpoint.profile, user);
        await (0, middleware_1.GqlValidation)(validation_1.paginationValidationSchema.query, args);
        const data = await this.postService.allPosts(args, user);
        return { message: "listed posts", data };
    };
    reactToPost = async (parent, { postId, react }, { user, decoded }) => {
        await (0, middleware_1.GqlValidation)(post_validation_1.gqlReactToPost, {
            postId,
            react,
        });
        const data = await this.postService.reactToPost({ postId }, { react }, user);
        return { message: "react applied to post", data };
    };
}
exports.PostResolver = PostResolver;
exports.postResolver = new PostResolver();
