import { RequestHandler } from "express";
import UserModel from "src/models/user";
import crypto from "crypto";
import AuthVerificationTokenModel from "src/models/authVeirficationToken";
import mail from "src/utils/mail";
import { sendErrorRes } from "src/utils/helper";

export const createNewUser: RequestHandler = async (req, res): Promise<void> => {

  // 1. 요청 본문에서 필요한 데이터 추출
  const { email, password, name } = req.body;


  // 2. 입력 데이터 유효성 검사
  if (!name) return sendErrorRes(res, "Name is missing!", 422);
  if (!email) return sendErrorRes(res, "Email is missing!", 422);
  if (!password) return sendErrorRes(res, "Password is missing!", 422);


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


  // 7. 계정 인증 이메일 발송
  await mail.sendVerification(user.email, link);


  // 9. 클라이언트에 성공 응답 전송
  res.json({ message: "Please check your inbox." });
  
};




export const verifyEmail: RequestHandler = async (req, res) => {

  //  1. 요청 본문에서 사용자 ID와 토큰 추출
  const { id, token } = req.body;

  // 2. 데이터베이스에서 사용자의 인증 토큰 찾기
  const authToken = await AuthVerificationTokenModel.findOne({ owner: id }); // owner 필드의 값이 id와 일치하는 문서 찾기
  if (!authToken) return sendErrorRes(res, "unauthorized request!", 403);

  // 3. 제공된 토큰과 저장된 토큰 비교
  const isMatched = await authToken.compareToken(token);
  if (!isMatched) return sendErrorRes(res, "unauthorized request, invalid token!", 403);

  // 4. 사용자 계정을 인증됨으로 업데이트
  await UserModel.findByIdAndUpdate(id, { verified: true });

  // 5. 사용된 인증 토큰 데이터베이스에서 삭제 (토큰 재사용 공격 방지)
  await AuthVerificationTokenModel.findByIdAndDelete(authToken._id);

  // 6. 성공 메시지 반환
  res.json({ message: "Thanks for joining us, your email is verified." });

}