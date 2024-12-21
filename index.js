import express from "express";
import cors from "cors";

// import dotenv
import "dotenv/config";

// import routes
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.send("Hello World");
});

app.use("/auth", authRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server is running on port http://localhost:" + process.env.PORT);
});
