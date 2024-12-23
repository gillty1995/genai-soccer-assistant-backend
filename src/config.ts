import rateLimit from "express-rate-limit";

export const corsOptions = {
  origin: [
    "https://futbolrules.hec.to",
    "https://www.futbolrules.hec.to",
    "https://api.futbolrules.hec.to",
    "http://localhost:5177", // for development
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Too many requests, please try again later.",
  standardHeaders: true, 
  legacyHeaders: false, 
});