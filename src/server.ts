import express, { Request, Response, Application } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { OpenAI } from "openai"; 
import dotenv from "dotenv";
import logger from "./logger";
import rateLimit from "express-rate-limit"; 
import { questionSchema } from "./validation"; 
import helmet from "helmet";

// environment variables
dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 5077;

// subdomains and localhost during development
const corsOptions = {
  origin: [
    'https://futbolrules.hec.to', 
    'https://www.futbolrules.hec.to',
    'https://api.futbolrules.hec.to',
    'http://localhost:5177',  // for development
  ],
  methods: ['GET', 'POST', 'OPTIONS'],  
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, 
  preflightContinue: false, 
  optionsSuccessStatus: 204,  
};

// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// middlewares
app.use(limiter);
app.use(helmet());
app.use(cors(corsOptions));  
app.use(bodyParser.json());

// incoming request logger
app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// openai api setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string, 
});

// questions route
app.post("/api/ask", async (req: Request, res: Response): Promise<void> => {
  const { question } = req.body;

  // joi validation
  const { error } = questionSchema.validate({ question });

  if (error) {
    logger.warn(`Validation failed: ${error.details[0].message}`);
    res.status(400).json({ error: error.details[0].message });
  }

  try {
    // openai api call
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Answer this question about soccer rules: ${question}`,
        },
      ],
    });

    // successful response
    logger.info(`Successfully answered the question: ${question}`);
    res.json({ answer: response.choices[0].message.content });
  } catch (error: unknown) {
    logger.error(`Error while processing question: ${error}`);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
});

// Listen on the specified port
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});