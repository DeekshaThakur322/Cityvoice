import express from "express";
import cors from "cors";
import authRoutes from "./api/routes/authRoutes.js";
import issueRoutes from "./api/routes/issueRoutes.js";
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("CityVoice API is working! ");
});

export default app;