import express from "express";
import morgan from "morgan";
import "dotenv/config";
import userRoutes from "./routes/user.routes.js";
const app = express();
import connect from "./db/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import projectRoutes from "./routes/project.routes.js";
import aiRoutes from "./routes/ai.routes.js";
const corsOptions = {
  origin: "https://reliable-meerkat-bce70e.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"], // Add allowed headers explicitly if needed
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, some Android browsers) choke on 204
};

app.use(cors(corsOptions));
connect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/user", userRoutes);
app.use(morgan("dev"));
app.use("/project", projectRoutes);
app.use("/ai", aiRoutes);

app.get("/", (req, res) => {
  res.send("hello");
});

export default app;
