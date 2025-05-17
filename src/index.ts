// 기본 모듈 및 라이브러리 import
import express from "express";
import cors from "cors";
import formidable from "formidable";
import path from "path";
import http from "http";
import { Server } from "socket.io";

// 내부 모듈 import
import "./db/index";
import authRouter from "./routes/auth";
import productRouter from "./routes/product";
import { TokenExpiredError, verify } from "jsonwebtoken";
import morgan from "morgan";

// Express 앱 및 HTTP 서버 생성
const app = express();
const server = http.createServer(app);

// Socket.IO 서버 설정 (클라이언트는 "/socket-message" 경로로 연결)
const io = new Server(server, {
  path: "/socket-message",
});

io.use((socket, next) => {
  const socketReq = socket.handshake.auth as { token: string } | undefined;

  if (!socketReq?.token) return next(new Error("Unauthorized request!"));

  try {
    const decoded = verify(socketReq.token, process.env.JWT_SECRET!);
    socket.data.jwtDecode = decoded;
    next();
  } catch (error: any) {
    if (error instanceof TokenExpiredError) {
      return next(new Error("jwt expired"));
    }
    return next(new Error("Invalid token!"));
  }
});

io.on("connection", (socket) => {
  console.log("[SERVER] 🚀 Socket connected:", socket.id);
});

// 미들웨어 등록
app.use(morgan('dev'))
app.use(cors()); 
app.use(express.static("src/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// 라우터 등록
app.use("/auth", authRouter);
app.use("/product", productRouter);


// 파일 업로드 API
app.post("/upload-file", async (req, res) => {
    const form = formidable({
        uploadDir: path.join(__dirname, "public"), // 업로드 파일 저장 경로
        filename(name, ext, part, form) { 
            return Date.now() + "_" + part.originalFilename; // 파일명 충돌 방지
        },
    });
    await form.parse(req); // 파일 파싱 및 저장

    res.send("ok"); // 클라이언트 응답
});


// 서버 실행
server.listen(8000, () => {
  console.log("The app is running on http://0.0.0.0:8000");
});