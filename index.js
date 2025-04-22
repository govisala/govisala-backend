import express from "express";
import cors from "cors";
import { createServer } from "http";
import { join, dirname } from "path";
import { Server } from "socket.io";

// import dotenv
import "dotenv/config";

// import routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationTest from "./routes/notificationTest.js";
import buyerRoutes from "./routes/buyerRouters.js";
import sellerRoutes from "./routes/sellerRouters.js";
import chatRoutes from "./routes/chatRoutes.js";
import test from "./routes/test.js";

// import db connection
import db from "./db/dbConn.js";

import handleReactNativeUploads from "./middleware/fileHandlingMiddleware.js";

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Add middleware to handle React Native uploads
app.use(handleReactNativeUploads);

// Serve uploaded files
app.use("/uploads", express.static(join(dirname("./"), "uploads")));

app.get("/", async (req, res) => {
  res.send("Hello World");
});

app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/notifi-test", notificationTest);
app.use("/test", test);
app.use("/buyer", buyerRoutes);
app.use("/seller", sellerRoutes);
app.use("/chat", chatRoutes);

server.listen(process.env.PORT, () => {
  console.log("Server is running on port http://localhost:" + process.env.PORT);
});
