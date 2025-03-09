import { RequestHandler } from "express";
import UserModel from "src/models/user";
import crypto from "crypto";
import AuthVerificationTokenModel from "src/models/authVeirficationToken";
import nodemailer from "nodemailer";

export const createNewUser: RequestHandler = async (req, res): Promise<void> => {

  // 1. 요청 본문에서 필요한 데이터 추출
  const { email, password, name } = req.body;


  // 2. 입력 데이터 유효성 검사
  if (!name) {
    res.status(422).json({ message: "Name is missing!" });
    return; 
  }
  if (!email) {
    res.status(422).json({ message: "Email is missing!" });
    return;
  }
  if (!password) {
    res.status(422).json({ message: "Password is missing!" });
    return;
  }


  // 3. 이메일 중복 확인
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    res.status(401).json({ message: "Unauthorized request, email is already in use!" });
    return;
  }


  // 4. 새 사용자 생성 (UserModel에 정의된 pre save 훅에 의해 비밀번호는 자동으로 해싱됨)
  const user = await UserModel.create({ name, email, password });


  // 5. 이메일 인증을 위한 토큰 생성
  const token = crypto.randomBytes(36).toString('hex') // 랜덤 토큰 생성
  await AuthVerificationTokenModel.create({ 
    owner: user._id, // 사용자 ID 참조
    token // 생성된 랜덤 토큰
  });


  // 6. 인증 링크 생성
  const link = `http://localhost:8000/verify?id=${user._id}&token=${token}`;


  // 7. 이메일 전송을 위한 전송자(transport) 설정
  const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "c5cf93b6836166",
      pass: "081dde13a955c9",
    },
  });


  // 8. 인증 이메일 전송
  await transport.sendMail({
    from: "verification@myapp.com",
    to: user.email,
    html: `<h1>Please click on <a href="${link}">this link</a> to verify your account.</h1>`,
  });


  // 9. 클라이언트에 성공 응답 전송
  res.json({ message: "Please check your inbox." });
  
};
