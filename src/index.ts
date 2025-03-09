import express from "express";
import authRouter from "./routes/auth";
import "./db/index";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/auth", authRouter);

app.listen(8000, () => {
    console.log("The app is running on http://localhost")
})