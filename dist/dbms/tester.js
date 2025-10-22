"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
const user_helpers_1 = require("./user-helpers");
(0, user_helpers_1.createPendingUser)("navneeth test", "9345611681", "navneethkrishnak@gmail.com", "11/08/2004", "Male", "abcdefg", db_1.default);
//# sourceMappingURL=tester.js.map