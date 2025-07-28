import app from "./app.js";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Project from "./models/project.model.js";
const server = http.createServer(app);
const port = process.env.PORT || 3000;
import aiService from "./services/ai.services.js";
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid projectId"));
    }

    socket.project = await Project.findById(projectId);

    if (!token) {
      return next(new Error("Authentication error"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return next(new Error("Authentication error"));
    }

    socket.user = decoded;

    next();
  } catch (err) {
    next(Error);
  }
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.roomId = socket.project._id.toString();

  socket.join(socket.roomId);
  socket.on("project-message", async (data) => {
    const message = data.message;

    const aiIsPresentInMessage = message.includes("@ai");
    socket.broadcast.to(socket.roomId).emit("project-message", data);
    if (aiIsPresentInMessage) {
      const prompt = message.replace("@ai", "");
      const result = await aiService(prompt);

      io.to(socket.roomId).emit("project-message", {
        message: result,
        sender: {
          _id: "ai",
          email: "AI-AGENT",
        },
      });

      return;
    }
    console.log("message", data);
    console.log(data);
  });
  socket.on("event", (data) => {});
  socket.on("disconnect", () => {
    console.log("user disconnected");
    socket.leave(socket.roomId);
  });
});
server.listen(port, "0.0.0.0", () => {
  console.log("listening..." + port);
});
