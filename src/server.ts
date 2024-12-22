import express, { Request, Response, Application } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import logger from "./logger";
import rateLimit from "express-rate-limit";
import { questionSchema } from "./validation";
import helmet from "helmet";

// Environment variables
dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 5077;

// CORS configuration
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

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
  standardHeaders: true, 
  legacyHeaders: false,  
  keyGenerator: (req) => req.ip || "unknown",  
});

// proxy headers 
app.set('trust proxy', 1);

// Middlewares
app.use(cors(corsOptions));
app.use(limiter);
app.use(helmet());
app.use(bodyParser.json());

// Handle OPTIONS preflight requests
app.options('*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

// Incoming request logger
app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// OpenAI API setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

// Questions route
app.post("/api/ask", async (req: Request, res: Response): Promise<void> => {
  const { question } = req.body;

  // Joi validation
  const { error } = questionSchema.validate({ question });

  if (error) {
    logger.warn(`Validation failed: ${error.details[0].message}`);
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  try {
    // OpenAI API call
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Answer this question about soccer rules: ${question}`,
        },
      ],
    });

    // Successful response
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

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is up and running');
});

// Listen on the specified port
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});