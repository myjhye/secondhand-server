import { RequestHandler } from "express";
import UserModel from "src/models/user";
import crypto from "crypto";
import AuthVerificationTokenModel from "src/models/authVeirficationToken";
import mail from "src/utils/mail";
import { sendErrorRes } from "src/utils/helper";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const VERIFICATION_LINK = process.env.VERIFICATION_LINK;
const JWT_SECRET = process.env.JWT_SECRET!;
const PASSWORD_RESET_LINK = process.env.PASSWORD_RESET_LINK!;


// 회원가입
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
  const link = `${VERIFICATION_LINK}?id=${user._id}&token=${token}`;
  //const link = `${VERIFICATION_LINK}?id=${user._id}&token=${token}`;


  // 7. 계정 인증 이메일 발송
  await mail.sendVerification(user.email, link);


  // 9. 클라이언트에 성공 응답 전송
  res.json({ message: "Please check your inbox." });
  
};




// 이메일 인증
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




export const generateVerificationLink: RequestHandler = async (req, res) => {

  /**
    1. 사용자 인증 여부 확인
    2. 이전 토큰이 있으면 제거
    3. 새 토큰 생성/저장
    4. 사용자 이메일에 링크 전송
    5. 응답 반환
  **/


  const { id } = req.user;
  const token = crypto.randomBytes(36).toString("hex");

  const link = `${VERIFICATION_LINK}?id=${id}&token=${token}`;

  await AuthVerificationTokenModel.findOneAndDelete({ owner: id });

  await AuthVerificationTokenModel.create({ 
    owner: id, 
    token 
  });

  await mail.sendVerification(req.user.email, link);

  res.json({ message: "Please check your inbox." });

}





// 로그인
export const signIn: RequestHandler = async (req, res) => {
 
  // 1. 이메일과 비밀번호를 입력 데이터로 받음
  const { email, password } = req.body;

  // 2. 제공된 이메일로 사용자 검색
  const user = await UserModel.findOne({ email });
  if (!user) return sendErrorRes(res, "Email/Password mismatch!", 403);

  // 3. 비밀번호가 유효한지 확인 (암호화된 형태로 저장되어 있음)
  const isMatched = await user.comparePassword(password);
  if (!isMatched) return sendErrorRes(res, "Email/Password mismatch!", 403);

  // 4. 유효하면 액세스 토큰과 리프레시 토큰 생성
  const payload = { // JWT에 포함할 데이터(페이로드) -> 사용자 ID (사용자 식별에 사용)
    id: user._id 
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, JWT_SECRET);

  // 5. 리프레시 토큰을 DB에 저장
  if (!user.tokens) {
    user.tokens = [refreshToken];
  }
  else {
    user.tokens.push(refreshToken);
  }

  await user.save();

  // 6. 두 토큰을 사용자에게 전송
  res.json({
    profile: {
      id: user._id,
      email: user.email,
      name: user.name,
      verified: user.verified,
    },
    tokens: { 
      refresh: refreshToken, 
      access: accessToken 
    },
  });

}


// 로그인한 사용자 프로필 정보 전송 (클라이언트 요청 받아)
export const sendProfile : RequestHandler = async (req, res) => {
  res.json({
    profile: req.user, // 미들웨어로 검증된 로그인한 사용자 프로필 정보 (유효한 토큰 제공됨, 그 토큰이 사용자 데이터베이스에 존재)
  })
}




// 리프레시 토큰으로 액세스 토큰 갱신
export const grantAccessToken: RequestHandler = async (req, res) => {

  // 1. 요청 본문에서 리프레시 토큰 읽기 및 검증
  const { refreshToken } = req.body;
  if (!refreshToken) return sendErrorRes(res, "Unauthorized request!", 403);

  // 2. JWT 토큰 검증(refreshToken) 및 페이로드에서 사용자 ID 추출
  const payload = jwt.verify(refreshToken, JWT_SECRET) as { id: string };
  if (!payload.id) return sendErrorRes(res, "Unauthorized request!", 401);

  // 3. 페이로드의 ID와 리프레시 토큰으로 사용자 찾기
  const user = await UserModel.findOne({
    _id: payload.id,
    tokens: refreshToken,
  });


  // 4.  토큰은 유효하지만 사용자가 없는 경우, 토큰이 손상된 것으로 간주
  // 모든 이전 토큰 제거 및 오류 응답 반환
  if (!user) {
    await UserModel.findByIdAndUpdate(payload.id, { tokens: [] });
    return sendErrorRes(res, "Unauthorized request!", 401);
  }


  // 5. 유효한 토큰과 사용자가 있는 경우, 새 리프레시 및 액세스 토큰 생성 (사용자 ID를 포함한 토큰을 생성)
  const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: "15m",
  });
  const newRefreshToken = jwt.sign({ id: user._id }, JWT_SECRET);


  // 6. 이전 토큰 제거, 사용자 업데이트 및 새 토큰 전송
  const filteredTokens = user.tokens.filter((t) => t !== refreshToken);
  user.tokens = filteredTokens;
  user.tokens.push(newRefreshToken);
  await user.save();

  res.json({
    tokens: { 
      refresh: newRefreshToken, 
      access: newAccessToken 
    },
  });
}



// 로그아웃 (리프레시 토큰 제거) -> 서버는 DB에 있는 리프레시 토큰만 제거(여기서 하는 일), 클라이언트는 액세스/리프레시 토큰 둘 다 제거
export const signOut: RequestHandler = async (req, res) => {

  // 1. 요청 본문에서 리프레시 토큰 추출
  const { refreshToken } = req.body;

  // 2. 요청에 포함된 사용자 ID와 리프레시 토큰으로 사용자 찾기
  const user = await UserModel.findOne({
    _id: req.user.id,
    tokens: refreshToken,
  });

  // 3. 사용자를 찾지 못한 경우 오류 응답 반환
  if (!user) return sendErrorRes(res, "Unauthorized request, user not found!", 403);

  // 4. 사용자의 토큰 목록에서 해당 리프레시 토큰 제거
  const newTokens = user.tokens.filter((t) => t !== refreshToken);
  user.tokens = newTokens;

  // 5. 변경된 사용자 정보 저장
  await user.save();

  // 6. 성공 응답 전송
  res.send();

}