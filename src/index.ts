import "dotenv/config";
import cors from "cors";
import express from "express";
import healthRouter from "./routes/health.js";
import authHealthyRouter from "./routes/auth-healthy.js";
import railwayRoutes from "./routes/railway/railwayRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? true,
  })
);
app.use(express.json());

app.use(healthRouter);
app.use(authHealthyRouter);
app.use("/railway", railwayRoutes);

app.listen(port, () => {
  console.log(`railway-api listening on http://localhost:${port}`);
});
