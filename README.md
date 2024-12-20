GenAI Soccer Assistant - Backend

Overview

The GenAI Soccer Assistant is a backend server built with Express.js that allows users to ask questions about soccer rules. The server interacts with OpenAI’s GPT-4 model to generate answers based on soccer regulations. It includes security features such as rate limiting, input validation, and logging to ensure a reliable and secure experience.

Technologies Used
• Node.js: JavaScript runtime for building the server.
• Express.js: Web framework for building the API.
• OpenAI API: Integrated with OpenAI GPT-4 for generating responses to soccer-related questions.
• Joi: Input validation library for ensuring data integrity.
• Winston: A logging library to log incoming requests and errors.
• Helmet: Middleware to secure HTTP headers.
• express-rate-limit: Middleware to limit the rate of requests.

License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
