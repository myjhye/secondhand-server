import express from "express";
import authRouter from "./routes/auth";
import "./db/index";

const app = express();

app.use(express.static("src/public")); // 정적 파일(HTML, CSS, JavaScript 등)을 제공할 디렉토리를 설정
app.use(express.json()); // JSON 형식의 요청 본문을 파싱하는 미들웨어를 설정 (앱이 JSON 형식의 데이터를 이해할 수 있게 도움)
app.use(express.urlencoded({ extended: false })); // URL-encoded 형식의 요청 본문을 파싱하는 미들웨어를 설정 (extended: false는 단순한 형식만 허용) (HTML 폼에서 입력한 데이터(예: 이름, 비밀번호 등)를 서버에서 쉽게 사용할 수 있도록 변환)

app.use("/auth", authRouter);

app.listen(8000, () => {
    console.log("The app is running on http://localhost:8000")
})