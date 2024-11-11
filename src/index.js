import http from "http";
import app from "./app.js"; // Import your Express app
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./db/index.js"; // Database connection

dotenv.config({ path: "./.env" });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Pass `io` to `app.js`
app.set("io", io);

// Socket.IO setup
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("sendNotification", (notification) => {
    io.emit("notification", notification);
  });
});

connectDB()
  .then(() => {
    server.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at PORT: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB Connection Failed !!!", err);
  });
