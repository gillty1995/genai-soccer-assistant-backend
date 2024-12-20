"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const openai_1 = require("openai");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./logger"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const validation_1 = require("./validation");
const helmet_1 = __importDefault(require("helmet"));
// environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5077;
// subdomains
const corsOptions = {
    origin: [
        'https://futbolrules.hec.to',
        'https://www.futbolrules.hec.to',
        'https://api.futbolrules.hec.to'
    ],
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type, Authorization',
};
// rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
// middlewares
app.use(limiter);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.use(body_parser_1.default.json());
// incoming request logger
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.url}`);
    next();
});
// openai api setup
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// questions route
app.post("/api/ask", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { question } = req.body;
    // joi validation
    const { error } = validation_1.questionSchema.validate({ question });
    if (error) {
        logger_1.default.warn(`Validation failed: ${error.details[0].message}`);
        res.status(400).json({ error: error.details[0].message });
    }
    try {
        // openai api call
        const response = yield openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "user",
                    content: `Answer this question about soccer rules: ${question}`,
                },
            ],
        });
        // successful response
        logger_1.default.info(`Successfully answered the question: ${question}`);
        res.json({ answer: response.choices[0].message.content });
    }
    catch (error) {
        logger_1.default.error(`Error while processing question: ${error}`);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }
}));
app.listen(PORT, () => {
    logger_1.default.info(`Server running on port ${PORT}`);
});
