import express from "express";
import cors from "cors"; // ✅ 추가
import authRouter from "./routes/auth";
import "./db/index";
import formidable from "formidable";
import path from "path";
import productRouter from "./routes/product";

const app = express();

app.use(cors()); // ✅ 추가
app.use(express.static("src/public")); // 정적 파일(HTML, CSS, JavaScript 등)을 제공할 디렉토리를 설정
app.use(express.json()); // JSON 형식의 요청 본문을 파싱하는 미들웨어를 설정 (앱이 JSON 형식의 데이터를 이해할 수 있게 도움)
app.use(express.urlencoded({ extended: false })); // URL-encoded 형식의 요청 본문을 파싱하는 미들웨어를 설정 (extended: false는 단순한 형식만 허용) (HTML 폼에서 입력한 데이터(예: 이름, 비밀번호 등)를 서버에서 쉽게 사용할 수 있도록 변환)


// 1. 
app.use("/auth", authRouter);
app.use("/product", productRouter);


// 2. 파일 업로드
app.post("/upload-file", async (req, res) => {
    const form = formidable({
        uploadDir: path.join(__dirname, "public"), // 업로드된 파일이 저장될 디렉토리 경로 설정 (__dirname은 현재 스크립트 파일의 디렉토리)
        filename(name, ext, part, form) { // 저장될 파일의 이름 설정
            return Date.now() + "_" + part.originalFilename; // 파일명 충돌 방지를 위해 현재 타임스탬프와 원본 파일명을 조합
        },
    });
    await form.parse(req); // 요청(req)에서 업로드된 파일을 파싱하고 지정된 디렉토리에 저장

    res.send("ok"); // 클라이언트에게 성공 응답 전송
});

app.listen(8000, () => {
    console.log("The app is running on http://0.0.0.0:8000");
})