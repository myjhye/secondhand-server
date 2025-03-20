import { RequestHandler } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import UserModel from "src/models/user";
import { sendErrorRes } from "src/utils/helper";
import dotenv from "dotenv";
import PasswordResetTokenModel from "src/models/passwordResetToken";

dotenv.config({ path: '.env.local' });

const JWT_SECRET = process.env.JWT_SECRET!;

interface UserProfile {
    id: string;
    name: string;
    email: string;
    verified: boolean;
}

// Express의 Request 타입 확장 -> user 속성 추가
declare global {
    namespace Express {
        interface Request {
            user: UserProfile;
        }
    }
}


// JWT 확인
export const isAuth: RequestHandler = async (req, res, next) => {

    try {
        // 1. 요청 헤더에서 JWT 토큰 조회
        const authToken = req.headers.authorization;
        if (!authToken) return sendErrorRes(res, "unauthorized request!", 403);

        // 2. "Bearer " 접두사를 제거하고 실제 토큰을 추출
        const token = authToken.split("Bearer ")[1];
        // 3. JWT 토큰을 검증하고 페이로드에서 사용자 ID를 추출
        const payload = jwt.verify(token, JWT_SECRET) as { id: string };

        // 4. 페이로드의 ID로 사용자를 데이터베이스에서 조회
        const user = await UserModel.findById(payload.id);
        if (!user) return sendErrorRes(res, "unauthorized request!", 403);

        // 5. 요청 객체에 사용자 정보 첨부
        req.user = {
            id: String(user._id),
            name: user.name,
            email: user.email,
            verified: user.verified,
        };
    
        // 6. 다음 미들웨어로 제어 넘기기
        next();
    }
    catch (error) {
        if (error instanceof TokenExpiredError) {
            return sendErrorRes(res, "Session expired!", 401);
        }
    
        if (error instanceof JsonWebTokenError) {
            return sendErrorRes(res, "Unauthorized Access!", 401);
        }
    }
}


// 비밀번호 재설정 토큰 유효성 검증
export const isValidPassResetToken: RequestHandler = async (req, res, next) => {

    // 1. 요청 본문에서 사용자 ID와 토큰 추출
    const { id, token } = req.body;

    // 2. 데이터베이스에서 해당 사용자 ID(owner)로 저장된 비밀번호 재설정 토큰 조회
    const resetPassToken = await PasswordResetTokenModel.findOne({ owner: id });
    if (!resetPassToken) return sendErrorRes(res, "Unauthorized request, invalid token!", 403);

    // 3. 제공된 토큰과 저장된 토큰 비교 (해싱된 토큰끼리 비교)
    const matched = await resetPassToken.compareToken(token);
    if (!matched) return sendErrorRes(res, "Unauthorized request, invalid token!", 403);

    // 4. 토큰 검증이 성공적으로 완료되면 다음 미들웨어로 제어 넘기기
    next();
}