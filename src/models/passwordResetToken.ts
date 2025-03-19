import { compare, genSalt, hash } from "bcrypt";
import { Schema, model } from "mongoose";

// 1. 타입 정의
interface PassResetTokenDocument extends Document {
    owner: Schema.Types.ObjectId; // 토큰 소유자 ID
    token: string; // 비밀번호 재설정 토큰 문자열
    createdAt: Date; // 토큰 생성 시간
}


interface Methods {
    compareToken(token: string): Promise<boolean>; // 토큰 비교 메소드
}


// 2. 스키마 정의 (비밀번호 재설정용 토큰)
const passwordResetSchema = new Schema<PassResetTokenDocument, {}, Methods>({

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        expires: 3600, // 1시간(3600초, 보안을 위해 더 짧은 시간 설정)
        default: Date.now(),
    },
});


// 3. 토큰 해싱
passwordResetSchema.pre("save", async function (next) {
    if (this.isModified("token")) { // 토큰이 변경된 경우만 실행
        const salt = await genSalt(10);
        this.token = await hash(this.token, salt); // 토큰 해싱 후 저장
    }

    next(); // 다음 단계로 이동
});


// 4. 토큰 검증 메소드 (입력받은 토큰과 저장된 해시된 토큰 비교)
passwordResetSchema.methods.compareToken = async function (token) {
    return await compare(token, this.token);
};


// 5. 생성한 모델 내보내기 (다른 파일에서 사용 가능하게)
const PasswordResetTokenModel = model("PasswordResetToken", passwordResetSchema);
export default PasswordResetTokenModel;