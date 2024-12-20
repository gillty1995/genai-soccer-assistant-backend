"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.questionSchema = joi_1.default.object({
    question: joi_1.default.string().min(5).max(500).required().messages({
        "string.base": `"Question" should be a type of 'text'`,
        "string.empty": `"Question" cannot be an empty field`,
        "string.min": `"Question" should have a minimum length of {#limit}`,
        "any.required": `"Question" is a required field`,
    }),
});
