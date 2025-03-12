import { RequestHandler } from "express";
import { sendErrorRes } from "src/utils/helper";
import * as yup from "yup";

const validate = (schema: yup.Schema): RequestHandler => {

    return async (req, res, next) => {
        try {
            // 요청 본문(req.body)을 스키마로 검증
            await schema.validate(
                {
                    ...req.body // 요청 본문의 모든 속성을 스프레드 연산자로 펼침
                },
                {
                    strict: true,
                    abortEarly: true // 첫 번째 오류 발생 시 검증 중단
                },
            );
            next(); // 유효성 검사 통과 시 다음 미들웨어로 이동
        }
        catch (error) {
            if (error instanceof yup.ValidationError) {
                sendErrorRes(res, error.message, 422);
            }
            else {
                next(error);
            }
        }
    } 
}

export default validate;