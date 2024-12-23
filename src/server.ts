import express, { Request, Response, Application } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import logger from "./logger";
import helmet from "helmet";
import { corsOptions, limiter } from "./config"; 
import { questionSchema } from "./validation";

// Environment variables
dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 5077;

// Proxy headers
app.set("trust proxy", 1);

// Middlewares
app.use(cors(corsOptions));
app.use(limiter);
app.use(helmet());
app.use(bodyParser.json());

// Handle OPTIONS preflight requests
app.options("*", (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend server is up and running" });
});

// Catch-all route for undefined endpoints
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
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

// Listen on the specified port
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server running on port ${PORT}`);
});