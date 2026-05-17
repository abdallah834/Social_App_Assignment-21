"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepo = void 0;
const models_1 = require("../models");
const base_repo_1 = require("./base.repo");
class ChatRepo extends base_repo_1.DataBaseRepo {
    constructor() {
        super(models_1.chatModel);
    }
    async findOneChat({ filter, projection, options, page = "1", size = "5", }) {
        page = parseInt(page);
        size = parseInt(size);
        const doc = this.model.findOne(filter, page && size
            ? {
                messages: { $slice: [-page * size, size] },
            }
            : null);
        if (options?.populate)
            doc.populate(options.populate);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
}
exports.ChatRepo = ChatRepo;
