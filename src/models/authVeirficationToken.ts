import { compare, genSalt, hash } from "bcrypt";
import { Schema, model } from "mongoose";


// 1. 타입 정의
interface AuthVerificationTokenDocument extends Document {
    owner: Schema.Types.ObjectId; // 토큰 소유자 ID
    token: string; // 인증 토큰 문자열
    createdAt: Date; // 토큰 생성 시간
}

interface Methods {
    compareToken(token: string): Promise<boolean>; // 토큰 비교 메소드
}



// 2. 스키마 정의 (이메일 인증용 토큰)
const authVerificationTokenSchema = new Schema<AuthVerificationTokenDocument, {}, Methods>({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User", // User 모델 참조
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        expires: 86400, // 24시간(86400초) 후 자동 삭제 (TTL 인덱스)
        default: Date.now(), // 기본 값으로 현재 시간 설정
    },
})


// 3. 토큰 해싱
authVerificationTokenSchema.pre("save", async function (next) {
    if (this.isModified("token")) { // 토큰이 변경된 경우만 실행
        const salt = await genSalt(10);
        this.token = await hash(this.token, salt); // 토큰 해싱 후 저장
    }

    next(); // 다음 단계로 이동
});


// 4. 토큰 검증 메소드 (입력받은 토큰과 저장된 해시된 토큰 비교)
authVerificationTokenSchema.methods.compareToken = async function (token) {
    return await compare(token, this.token);
};


// 5. 생성한 모델 내보내기 (다른 파일에서 사용 가능하게)
const AuthVerificationTokenModel = model("AuthVerificationToken", authVerificationTokenSchema);
export default AuthVerificationTokenModel;