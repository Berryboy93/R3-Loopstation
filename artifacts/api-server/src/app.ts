import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// JSON 404 for unknown routes (instead of Express's default HTML page)
app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

// Global error handler — uncaught route errors return JSON, never an HTML
// stack trace, and are logged through the structured logger.
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error({ err, url: req.url }, "Unhandled route error");
    if (!res.headersSent) {
      res.status(500).json({ error: "internal_server_error" });
    }
  },
);

export default app;
