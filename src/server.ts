import path from "path";
import express, { Request, Response, Application } from "express";
import cors from "cors";
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
app.set("trust proxy", false);

// Middlewares
app.use(cors(corsOptions));
app.use(limiter);
app.use(helmet());
app.use(express.json({ limit: '20mb' }));  

// Handle OPTIONS preflight requests
app.options("*", (req: Request, res: Response) => {
 const allowed = ["https://futbolrules.mine.bz", "https://www.futbolrules.mine.bz"];
  const origin = req.headers.origin as string;
  if (allowed.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(204);
  return;
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

// Test route
app.get("/test", (req: Request, res: Response) => {
  res.json({ message: "Test route is working!" });
});

// API route
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
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Answer this question about soccer rules: ${question}`,
        },
      ],
    });

    logger.info(`Successfully answered the question: ${question}`);
    res.json({ answer: response.choices[0].message.content });
  } catch (error: unknown) {
    logger.error(`Error while processing question: ${error}`);
    res.status(500).json({ error: "An unknown error occurred" });
  }
});

// Serve React app static files
const frontendDir = "/var/www/frontend/dist";
app.use(express.static(frontendDir))


app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server running on port ${PORT}`);
});