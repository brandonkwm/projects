import express from "express";
import cors from "cors";
import reconciliationTypesRouter from "./routes/reconciliation-types.js";
import runsRouter from "./routes/runs.js";
import explanationsRouter from "./routes/explanations.js";
import dashboardRouter from "./routes/dashboard.js";
import askRouter from "./routes/ask.js";
import compareRouter from "./routes/compare.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use("/api/reconciliation-types", reconciliationTypesRouter);
app.use("/api/runs", runsRouter);
app.use("/api/explanations", explanationsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ask", askRouter);
app.use("/api/compare", compareRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Reconciliation platform API at http://localhost:${PORT}`);
});
