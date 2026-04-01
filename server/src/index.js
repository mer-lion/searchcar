import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { startScheduler } from "./scraper/scheduler.js";
import { initBot } from "./telegram/bot.js";
import { startKeepAlive } from "./keep-alive.js";
import { startCleanup } from "./scraper/cleanup.js";
import listingsRouter from "./routes/listings.js";
import analysisRouter from "./routes/analysis.js";
import watchlistRouter from "./routes/watchlist.js";
import trendsRouter from "./routes/trends.js";
import scraperRouter from "./routes/scraper.js";
import usersRouter from "./routes/users.js";
import aiRouter from "./routes/ai.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/listings", listingsRouter);
app.use("/api/analysis", analysisRouter);
app.use("/api/watchlist", watchlistRouter);
app.use("/api/trends", trendsRouter);
app.use("/api/scraper", scraperRouter);
app.use("/api/users", usersRouter);
app.use("/api/ai", aiRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.use((req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

startScheduler();
startCleanup();
initBot();
startKeepAlive();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
