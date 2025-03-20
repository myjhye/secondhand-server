import { Document, Schema, model } from "mongoose";
import { hash, compare, genSalt } from "bcrypt";


// 1. 타입 정의
interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  verified: boolean;
  tokens: string[];
  avatar: {
    url: string,
    id: string,
  };
}

interface Methods {
  comparePassword(password: string): Promise<boolean>;
}


// 2. 스키마 정의
const userSchema = new Schema<UserDocument, {}, Methods>( // Schema<문서타입, 정적메소드타입(없음 -> {}), 인스턴스메소드타입>
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    tokens: [String], // 리프레시 토큰 배열 필드인 이유 -> 한 사용자가 여러 기기에서 동시에 로그인 (각 기기마다 다른 리프레시 토큰 저장)
    avatar: {
      url: String,
      id: String,
    },
  },
  { 
    timestamps: true // 자동으로 createdAt과 updatedAt 필드 추가
  }
);



// 3. 비밀번호 해싱
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {  // 비밀번호가 변경된 경우만 실행
    const salt = await genSalt(10);
    this.password = await hash(this.password, salt); // 비밀번호 해싱 후 저장
  }

  next(); // 다음 단계로 이동
});


// 4. 비밀번호 검증 메소드 (로그인 시 사용자가 입력한 비밀번호와 저장된 해시된 비밀번호 비교)
userSchema.methods.comparePassword = async function (password) {
  return await compare(password, this.password); // true(일치) / false(불일치) 반환
};



// 5. 생성한 모델 내보내기 (다른 파일에서 사용 가능하게)
const UserModel = model("User", userSchema);
export default UserModel;