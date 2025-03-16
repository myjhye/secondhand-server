import { RequestHandler } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import UserModel from "src/models/user";
import { sendErrorRes } from "src/utils/helper";
import dotenv from "dotenv";

dotenv.config();

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