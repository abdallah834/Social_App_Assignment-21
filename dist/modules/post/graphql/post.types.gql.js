"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactToPost = exports.postListType = exports.singlePostType = exports.gqlAvailabilityEnum = void 0;
const graphql_1 = require("graphql");
const user_types_gql_1 = require("../../user/gql/user.types.gql");
const enums_1 = require("../../../common/enums");
exports.gqlAvailabilityEnum = new graphql_1.GraphQLEnumType({
    name: "gqlAvailabilityEnum",
    values: {
        Friends: { value: enums_1.AvailabilityEnum.FRIENDS },
        Only_Me: { value: enums_1.AvailabilityEnum.ONLY_ME },
        Public: { value: enums_1.AvailabilityEnum.PUBLIC },
    },
});
exports.singlePostType = new graphql_1.GraphQLObjectType({
    name: "singlePostType",
    fields: {
        _id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
        folderId: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        content: { type: graphql_1.GraphQLString },
        attachments: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        likes: {
            type: new graphql_1.GraphQLList(user_types_gql_1.OneUserType),
        },
        tags: {
            type: new graphql_1.GraphQLList(user_types_gql_1.OneUserType),
        },
        availability: { type: exports.gqlAvailabilityEnum },
        createdBy: { type: new graphql_1.GraphQLNonNull(user_types_gql_1.OneUserType) },
        updatedBy: { type: user_types_gql_1.OneUserType },
        createdAt: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        deletedAt: { type: graphql_1.GraphQLString },
        restoredAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
    },
});
exports.postListType = new graphql_1.GraphQLObjectType({
    name: "postListResponse",
    fields: {
        message: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        data: {
            type: new graphql_1.GraphQLObjectType({
                name: "postPaginationResponse",
                fields: {
                    docs: { type: new graphql_1.GraphQLList(exports.singlePostType) },
                    currentPage: { type: graphql_1.GraphQLInt },
                    size: { type: graphql_1.GraphQLInt },
                    pages: { type: graphql_1.GraphQLInt },
                },
            }),
        },
    },
});
exports.reactToPost = new graphql_1.GraphQLObjectType({
    name: "ReactToPostResponse",
    fields: {
        message: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        data: { type: exports.singlePostType },
    },
});
