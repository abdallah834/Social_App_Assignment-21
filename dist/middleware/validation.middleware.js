"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIoValidation = exports.GqlValidation = exports.validation = void 0;
const exceptions_1 = require("../common/exceptions");
const gql_excepitions_1 = require("../common/exceptions/gql.excepitions");
const validation = (schema) => {
    return (req, res, next) => {
        let issues = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req.file) {
                req.body.file = req.file;
            }
            if (req.files) {
                req.body.files = req.files;
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error;
                issues.push({
                    key,
                    issues: error.issues.map((issue) => ({
                        path: issue.path,
                        message: issue.message,
                    })),
                });
            }
        }
        if (issues.length) {
            return next(new exceptions_1.BadRequestException("Validation error", { issues }));
        }
        next();
    };
};
exports.validation = validation;
const GqlValidation = async (schema, args) => {
    const validationResult = schema.safeParse(args);
    if (!validationResult.success) {
        throw (0, gql_excepitions_1.mapGQLError)(new exceptions_1.BadRequestException("Validation error", {
            issues: validationResult.error.issues.map((issue) => {
                return { path: issue.path, message: issue.message };
            }),
        }));
    }
    return true;
};
exports.GqlValidation = GqlValidation;
const SocketIoValidation = (schema, args) => {
    const validationResult = schema.safeParse(args);
    if (!validationResult.success) {
        throw new exceptions_1.BadRequestException("Validation error", {
            issues: validationResult.error.issues.map((issue) => {
                return { path: issue.path, message: issue.message };
            }),
        });
    }
    return true;
};
exports.SocketIoValidation = SocketIoValidation;
