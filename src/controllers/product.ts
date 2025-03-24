import { UploadApiResponse } from "cloudinary";
import { RequestHandler } from "express";
import ProductModel from "src/models/product";
import { sendErrorRes } from "src/utils/helper";
import cloudUploader from "src/cloud";


const uploadImage = (filePath: string): Promise<UploadApiResponse> => {
    return cloudUploader.upload(filePath, {
        width: 1280,
        height: 720,
        crop: "fill",
    });
};


// 새 상품 등록
export const listNewProduct: RequestHandler = async (req, res) => {

    // 1. 요청 바디에서 제품 정보 추출
    const { name, price, category, description, purchasingDate } = req.body;

    // 2. 상품 모델 생성
    const newProduct = new ProductModel({
        owner: req.user.id,
               name,
               price,
               category,
               description,
               purchasingDate,
    });

    // 3. 요청에서 이미지 파일 추출
    const { images } = req.files;
    const isMultipleImages = Array.isArray(images);

    // 4. 이미지 수량 제한 (최대 5개)
    if (isMultipleImages && images.length > 5) {
        return sendErrorRes(res, "Image files can not be more than 5!", 422);
    }

    // 5. 이미지 타입 유효성 검사
    let invalidFileType = false;
    if (isMultipleImages) { // 5-1. 다중 이미지 경우
        for (let img of images) {
            if (!img.mimetype?.startsWith("image")) {
                invalidFileType = true;
                break;
            }
        }
    }
    else { // 5-2. 단일 이미지 경우
        if (images) {
            if (!images.mimetype?.startsWith("image")) {
                invalidFileType = true;
            }
        }
    }

    // 6. 유효하지 않은 파일 타입 에러 반환
    if (invalidFileType) return sendErrorRes(res, "Invalid file type, files must be image type!", 422);

    // 7. 파일 업로드 처리
    if (isMultipleImages) {
        // 7-1. 다중 이미지 업로드
        const uploadPromise = images.map((file) => uploadImage(file.filepath));
        
        // 7-2. 모든 파일 업로드 완료 대기
        const uploadResults = await Promise.all(uploadPromise);

        // 7-3. 업로드된 이미지 정보를 제품 모델에 저장
        newProduct.images = uploadResults.map(({ secure_url, public_id }) => {
            return { 
                url: secure_url, 
                id: public_id 
            };
        });

        // 7-4. 첫 번째 이미지를 썸네일로 설정
        newProduct.thumbnail = newProduct.images[0].url;
    }
    else {
        if (images) { // 7-5. 단일 이미지 업로드
            const { secure_url, public_id } = await uploadImage(images.filepath);
            newProduct.images = [
                { 
                    url: secure_url, 
                    id: public_id 
                }
            ];

            // 7-6. 썸네일 설정 (단일 이미지인 경우)
            newProduct.thumbnail = secure_url;
        }
    }

    // 8. 제품 저장
    await newProduct.save();

    // 9. 성공 응답 반환
    res.status(201).json({ message: "Added new product!" });

}