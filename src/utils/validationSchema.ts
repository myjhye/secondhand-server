import { isValidObjectId } from "mongoose";
import * as yup from "yup";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // 이메일 형식 검증
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/; // 비밀번호 형식 검증


// 공통으로 사용되는 비밀번호 검증 규칙
const password = {
    password: yup.string()
        .required("Password is missing")
        .min(8, "Password should be at least 8 chars long!")
        .matches(passwordRegex, "Password is too simple."),
};

// 공통으로 사용되는 토큰과 ID 검증 규칙
const tokenAndId = {
    id: yup.string().test({
        name: "valid-id",
        message: "Invalid user id",
        test: (value) => {
            return isValidObjectId(value);
        },
    }),
    token: yup.string().required("Token is missing"),
};



// 새 사용자 등록 스키마
export const newUserSchema = yup.object({
    name: yup.string().required("Name is missing"),
    email: yup.string().required("Email is missing").matches(emailRegex, "Invalid email format"),
    ...password,
});


// 토큰 검증 스키마
export const verifyTokenSchema = yup.object({
    ...tokenAndId,
});


// 비밀번호 재설정 스키마
export const resetPassSchema = yup.object({
    ...tokenAndId,
    ...password,
});