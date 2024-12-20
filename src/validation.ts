import Joi from "joi";

export const questionSchema = Joi.object({
  question: Joi.string().min(5).max(500).required().messages({
    "string.base": `"Question" should be a type of 'text'`,
    "string.empty": `"Question" cannot be an empty field`,
    "string.min": `"Question" should have a minimum length of {#limit}`,
    "any.required": `"Question" is a required field`,
  }),
});