"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileType = exports.OneUserType = exports.gqlRoleEnumType = exports.gqlProviderEnumType = exports.gqlGenderEnumType = void 0;
const graphql_1 = require("graphql");
const enums_1 = require("../../../common/enums");
exports.gqlGenderEnumType = new graphql_1.GraphQLEnumType({
    name: "genderEnumGQL",
    values: {
        Male: { value: enums_1.GenderEnum.MALE },
        Female: { value: enums_1.GenderEnum.FEMALE },
    },
});
exports.gqlProviderEnumType = new graphql_1.GraphQLEnumType({
    name: "providerEnumGQL",
    values: {
        Google: { value: enums_1.ProviderEnums.GOOGLE },
        System: { value: enums_1.ProviderEnums.SYSTEM },
    },
});
exports.gqlRoleEnumType = new graphql_1.GraphQLEnumType({
    name: "roleEnumGQL",
    values: {
        Admin: { value: enums_1.RoleEnum.ADMIN },
        User: { value: enums_1.RoleEnum.USER },
    },
});
exports.OneUserType = new graphql_1.GraphQLObjectType({
    name: "oneUserType",
    fields: () => ({
        _id: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID),
            resolve: (parent) => {
                return parent._id;
            },
        },
        firstName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        lastName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        slug: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        coverImages: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        friends: { type: new graphql_1.GraphQLList(exports.OneUserType) },
        createdAt: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
        },
        password: { type: graphql_1.GraphQLString },
        username: { type: graphql_1.GraphQLString },
        phone: { type: graphql_1.GraphQLString },
        bio: { type: graphql_1.GraphQLString },
        DOB: { type: graphql_1.GraphQLString },
        confirmedAt: {
            type: graphql_1.GraphQLString,
        },
        updatedAt: {
            type: graphql_1.GraphQLString,
        },
        deletedAt: {
            type: graphql_1.GraphQLString,
        },
        restoredAt: {
            type: graphql_1.GraphQLString,
        },
        changedCredentialsTime: {
            type: graphql_1.GraphQLString,
        },
        profileImage: { type: graphql_1.GraphQLString },
        provider: { type: exports.gqlProviderEnumType },
        role: { type: exports.gqlRoleEnumType },
        gender: { type: exports.gqlGenderEnumType },
        paranoid: { type: graphql_1.GraphQLBoolean },
    }),
});
exports.profileType = new graphql_1.GraphQLNonNull(new graphql_1.GraphQLObjectType({
    name: "profileResponse",
    fields: {
        message: { type: graphql_1.GraphQLString },
        data: { type: exports.OneUserType },
    },
}));
