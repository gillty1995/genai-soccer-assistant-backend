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
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const openai_1 = require("openai");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./logger"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const validation_1 = require("./validation");
// Environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5077;
// Proxy headers
app.set("trust proxy", false);
// Middlewares
app.use((0, cors_1.default)(config_1.corsOptions));
app.use(config_1.limiter);
app.use((0, helmet_1.default)());
app.use(express_1.default.json({ limit: '20mb' }));
// Handle OPTIONS preflight requests
app.options("*", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.sendStatus(204);
});
// Incoming request logger
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});
// Serve React app static files
const frontendDir = "/var/www/frontend/dist";
app.use(express_1.default.static(frontendDir));
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(frontendDir, "index.html"));
});
// OpenAI API setup
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// Test route
app.get("/test", (req, res) => {
    res.json({ message: "Test route is working!" });
});
// API route
app.post("/api/ask", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { question } = req.body;
    // Joi validation
    const { error } = validation_1.questionSchema.validate({ question });
    if (error) {
        logger_1.default.warn(`Validation failed: ${error.details[0].message}`);
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    try {
        const response = yield openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "user",
                    content: `Answer this question about soccer rules: ${question}`,
                },
            ],
        });
        logger_1.default.info(`Successfully answered the question: ${question}`);
        res.json({ answer: response.choices[0].message.content });
    }
    catch (error) {
        logger_1.default.error(`Error while processing question: ${error}`);
        res.status(500).json({ error: "An unknown error occurred" });
    }
}));
app.listen(PORT, "0.0.0.0", () => {
    logger_1.default.info(`Server running on port ${PORT}`);
});
