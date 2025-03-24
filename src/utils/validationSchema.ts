import { isValidObjectId } from "mongoose";
import * as yup from "yup";
import categories from "./categories";
import { parseISO } from "date-fns";

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


// 새 상품 등록 스키마
export const newProductSchema = yup.object({
    name: yup.string().required("Name is missing!"), // 상품명 (필수값)
    description: yup.string().required("Description is missing!"), // 상품 설명 (필수값)
    category: yup
        .string()
        .oneOf(categories, "Invalid category!") // 카테고리 값이 미리 정의된 categories 배열 내에 있는지 검증
        .required("Category is missing!"), // 카테고리 값 필수
    price: yup
        .string()
        .transform((value) => { 
            if (isNaN(+value)) { // 숫자로 변환할 수 없는 값인 경우 빈 문자열로 변환
                return ""
            } 
            return +value; // 숫자로 변환 가능한 경우 숫자 타입으로 변환
        })
        .required("Price is missing!"), // 가격 값 필수
    purchasingDate: yup
        .string()
        .transform((value) => {
        try {
            return parseISO(value); // 문자열을 Date 객체로 변환 시도 (date-fns의 parseISO 함수 사용)
        } 
        catch (error) {
            return ""; // 변환 실패 시 빈 문자열 반환
        }
        })
        .required("Purchasing date is missing!"), // 구매 날짜 값 필수
});