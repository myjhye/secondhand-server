import { RequestHandler } from "express";
import UserModel from "src/models/user";
import crypto from "crypto";
import AuthVerificationTokenModel from "src/models/authVeirficationToken";
import mail from "src/utils/mail";
import { sendErrorRes } from "src/utils/helper";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import PasswordResetTokenModel from "src/models/passwordResetToken";
import { v2 as cloudinary } from "cloudinary";
import { isValidObjectId } from "mongoose";
import cloudUploader from "src/cloud";

dotenv.config({ path: '.env.local' });

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
      avatar: user.avatar?.url || user.avatar,
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



// 사용자가 비밀번호를 잊어버렸을 때 이메일로 비밀번호 재설정 링크를 생성하고 전송
export const generateForgetPassLink: RequestHandler = async (req, res) => {

  // 1. 요청 본문에서 이메일 추출
  const { email } = req.body;

  // 2. 제공된 이메일로 사용자 검색
  const user = await UserModel.findOne({ email });
  if (!user) return sendErrorRes(res, "Account not found!", 404);

  // 3. 이전에 발급된 비밀번호 재설정 토큰이 있다면 제거 (토큰 중복 방지)
  await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });

  // 4. 새 비밀번호 재설정 토큰 생성
  const token = crypto.randomBytes(36).toString("hex");
  
  // 5. 생성된 토큰을 데이터베이스에 저장
  await PasswordResetTokenModel.create({ 
    owner: user._id, // 사용자 ID 참조
    token // 생성된 랜덤 토큰
  });

  // 6. 비밀번호 재설정 링크 생성
  const passResetLink = `${PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`;
  
  // 7. 생성된 링크를 사용자 이메일로 전송
  await mail.sendPasswordResetLink(user.email, passResetLink);

  // 8. 클라이언트에 성공 응답 전송
  res.json({ message: "Please check your inbox for password reset instructions." });
}



// 비밀번호 재설정 토큰 검증 성공 시 클라이언트에 유효함 전송
export const grantValid: RequestHandler = async (req, res) => {
  res.json({ valid: true });
};



// 비밀번호 재설정 요청 처리
export const updatePassword: RequestHandler = async (req, res) => {

  // 1. 요청 본문에서 사용자 ID와 새 비밀번호 추출
  const { id, password } = req.body;

  // 2. 제공된 ID로 사용자 검색
  const user = await UserModel.findById(id);
  if (!user) return sendErrorRes(res, "Unauthorized access!", 403);

  // 3. 새 비밀번호가 기존 비밀번호와 같은지 확인 (보안 강화를 위해 다른 비밀번호로 변경하도록 함)
  const matched = await user.comparePassword(password);
  if (matched) return sendErrorRes(res, "The new password must be different!", 422);

  // 4. 사용자 모델에 새 비밀번호 저장 (UserModel의 pre save 훅에 의해 비밀번호는 자동으로 해싱됨)
  user.password = password;
  await user.save();

  // 5. 사용된 비밀번호 재설정 토큰 데이터베이스에서 삭제 (토큰 재사용 공격 방지)
  await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });

  // 6. 비밀번호 변경 알림 이메일 발송
  await mail.sendPasswordUpdateMessage(user.email);

  // 7. 클라이언트에 성공 응답 전송
  res.json({ message: "Password resets successfully." });
}



// 사용자 프로필 업데이트 (이름 변경)
export const updateProfile: RequestHandler = async (req, res) => {

  // 1. 요청 본문에서 이름 추출
  const { name } = req.body;

  // 2. 이름 유효성 검사 (문자열이며 최소 3자 이상이어야 함)
  if (typeof name !== "string" || name.trim().length < 3) {
    return sendErrorRes(res, "Invalid name!", 422);
  }

  // 3. 현재 로그인된 사용자의 ID로 데이터베이스에서 사용자를 찾아 이름 업데이트
  await UserModel.findByIdAndUpdate(req.user.id, { name });

  // 4. 업데이트된 프로필 정보와 함께 성공 응답 전송
  res.json({ 
    profile: { 
      ...req.user, 
      name 
    } 
  });

}



// 사용자 프로필 이미지 업데이트
export const updateAvatar: RequestHandler = async (req, res) => {
  try {
    // 1. 요청에 파일이 포함되어 있는지 확인
    if (!req.files || !req.files.avatar) {
      return sendErrorRes(res, "Avatar file is missing!", 422);
    }

    // 2. 요청에서 아바타 파일 추출
    const { avatar } = req.files;
    
    // 3. 단일 파일인지 확인 (다중 파일 업로드 방지)
    if (Array.isArray(avatar)) {
      return sendErrorRes(res, "Multiple files are not allowed!", 422);
    }

    // 4. 파일이 이미지 형식인지 확인
    if (!avatar.mimetype?.startsWith("image")) {
      return sendErrorRes(res, "Invalid image file!", 422);
    }

    // 5. 현재 로그인한 사용자 ID로 사용자 검색
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return sendErrorRes(res, "User not found!", 404);
    }

    // 6. Cloudinary에 이미지 업로드 처리
    let uploadResult;
    try {
      // 6-1. 기존 아바타 이미지가 있으면 Cloudinary에서 삭제
      if (user.avatar?.id) {
        await cloudUploader.destroy(user.avatar.id);
      }
      
      // 6-2. 새 이미지 업로드 (얼굴 중심의 300x300 썸네일로 크롭)
      uploadResult = await cloudUploader.upload(
        avatar.filepath,
        {
          width: 300,
          height: 300,
          crop: "thumb",
          gravity: "face",
        }
      );
    } 
    catch (cloudinaryError) {
      // 6-3. Cloudinary 업로드 실패 시 오류 처리
      console.error("Cloudinary upload error:", cloudinaryError);
      return sendErrorRes(res, "Failed to upload image to cloud storage", 500);
    }
    
    // 7. 업로드 결과에서 이미지 URL(secure_url)과 ID(public_id) 추출
    const { 
      secure_url: url, 
      public_id: id 
    } = uploadResult;
    
    // 8. 사용자 모델에 새 아바타 정보 저장
    user.avatar = { url, id };
    await user.save();

    // 9. 업데이트된 프로필 정보와 함께 성공 응답 전송
    res.json({ 
      profile: { 
        ...req.user, 
        avatar: user.avatar.url 
      } 
    });
  } catch (error) {
    console.error("Error in updateAvatar:", error);
    return sendErrorRes(res, "An error occurred while updating avatar", 500);
  }
}




// 사용자 공개 프로필 정보 조회
export const sendPublicProfile: RequestHandler = async (req, res) => {

  // 1. URL 파라미터에서 프로필 ID 추출
  const profileId = req.params.id;

  // 2. 프로필 ID의 유효성 검사 (MongoDB ObjectId 형식인지 확인)
  if (!isValidObjectId(profileId)) {
    return sendErrorRes(res, "Invalid profile id!", 422);
  }

  // 3. 제공된 ID로 사용자 검색
  const user = await UserModel.findById(profileId);
  if (!user) {
    return sendErrorRes(res, "Profile not found!", 404);
  }

  // 4. 공개적으로 접근 가능한 제한된 프로필 정보만 응답으로 전송 (ID, 이름, 아바타 URL만 포함 - 이메일, 비밀번호 등 개인정보는 제외)
  res.json({
    profile: { 
      id: user._id, 
      name: user.name, 
      avatar: user.avatar?.url 
    },
  });

}
