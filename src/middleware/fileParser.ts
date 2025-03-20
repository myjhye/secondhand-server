/*
요청으로 들어온 폼 데이터 중 일반 텍스트는 req.body에, 파일은 req.files에 저장하는 미들웨어
*/

import { RequestHandler } from "express";
import formidable, { File } from "formidable";

// 1. TypeScript 타입 정의: Express의 Request 객체에 files 속성 추가
declare global {
    namespace Express {
        interface Request {
            files: { 
                [key: string]: File | File[] 
            };
        }
    }
}

const fileParser: RequestHandler = async (req, res, next) => {

    // 2. formidable 인스턴스 생성
    const form = formidable();

    // 3. 요청(req)에서 form 데이터 파싱(formidable 사용) (fields=일반 데이터, files=파일 데이터)
    const [fields, files] = await form.parse(req);

    // 4. req.body가 없으면 빈 객체 생성
    if (!req.body) {
        req.body = {};
    }

    // 5. 일반 폼 데이터를 req.body에 추가
    for (let key in fields) {
        req.body[key] = fields[key]![0];
    }

    // 6. req.files가 없으면 빈 객체 생성
    if (!req.files) {
        req.files = {};
    }

    // 7. 파일 데이터를 req.files에 추가
    for (let key in files) {
        const actualFiles = files[key];
        // 8. 파일이 없으면 반복 중단
        if (!actualFiles) {
            break;
        }
        
        // 9. 여러 파일이면 배열로 저장, 단일 파일이면 파일 객체만 저장
        if (actualFiles.length > 1) {
            req.files[key] = actualFiles;
        } 
        else {
            req.files[key] = actualFiles[0];
        }
    }

    next();

}

export default fileParser;
