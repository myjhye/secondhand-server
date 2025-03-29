import { UploadApiResponse } from "cloudinary";
import { RequestHandler } from "express";
import ProductModel from "src/models/product";
import { sendErrorRes } from "src/utils/helper";
import cloudUploader from "src/cloud";
import { isValidObjectId } from "mongoose";


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
        
        // 7-2. 모든 파일 업로드 완료 대기 (모든 이미지가 성공적으로 업로드되었는지 확인, 하나라도 실패 시 전체 트랜잭션 관리해야 함)
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




// 상품 수정
export const updateProduct: RequestHandler = async (req, res) => {

    // 1. 요청 바디에서 제품 정보 추출
    const { name, price, category, description, purchasingDate, thumbnail } = req.body;

    // 2. URL 파라미터에서 상품 ID 추출 및 유효성 검사
    const productId = req.params.id;
    if (!isValidObjectId(productId)) return sendErrorRes(res, "Invalid product id!", 422);

    // 3. 상품 찾기 및 업데이트 (소유자 일치 확인)
    const product = await ProductModel.findOneAndUpdate(
        { 
            _id: productId, // 요청된 상품 ID로 문서 검색
            owner: req.user.id // 현재 로그인한 사용자가 소유한 상품인지 확인
        },
        {
            name, // 상품명 업데이트
            price, // 가격 업데이트
            category, // 카테고리 업데이트
            description, // 설명 업데이트
            purchasingDate, // 구매일자 업데이트
        }, 
        {
            new: true, // true: 업데이트 후의 문서 반환, false: 업데이트 전 문서 반환
        },
    );

    // 4. 상품이 존재하지 않거나 소유자가 일치하지 않는 경우 에러 반환
    if (!product) return sendErrorRes(res, "Product not found!", 404);

    // 5. 썸네일 업데이트 (문자열인 경우에만)
    if (typeof thumbnail === "string") {
        product.thumbnail = thumbnail
    };

    // 6. 요청에서 이미지 파일 추출
    const { images } = req.files;
    const isMultipleImages = Array.isArray(images);

    // 7. 이미지 수량 제한 (최대 5개) 확인
    if (isMultipleImages) {
        const oldImages = product.images?.length || 0;
        if (oldImages + images.length > 5) {
            return sendErrorRes(res, "Image files can not be more than 5!", 422);
        }
    }

    // 8. 이미지 타입 유효성 검사
    let invalidFileType = false;

    if (isMultipleImages) { // 8-1. 다중 이미지 경우
        for (let img of images) {
            if (!img.mimetype?.startsWith("image")) {
            invalidFileType = true;
            break;
            }
        }
    } 
    else { // 8-2. 단일 이미지 경우
        if (images) {
            if (!images.mimetype?.startsWith("image")) {
                invalidFileType = true;
            }
        }
    }

    // 9. 유효하지 않은 파일 타입 에러 반환
    if (invalidFileType) return sendErrorRes(res, "Invalid file type, files must be image type!", 422);
    

    // 10. 파일 업로드 처리
    if (isMultipleImages) { // 10-1. 다중 이미지 업로드
        const uploadPromise = images.map((file) => uploadImage(file.filepath));
        const uploadResults = await Promise.all(uploadPromise);
        const newImages = uploadResults.map(({ secure_url, public_id }) => {
            return { 
                url: secure_url, 
                id: public_id 
            };
        });

        // 10-2. 기존 이미지 배열에 새 이미지 추가
        if (product.images) {
            product.images.push(...newImages);
        }
        else {
            product.images = newImages;
        }
    } 
    else { // 10-3. 단일 이미지 업로드
        if (images) {
            const { secure_url, public_id } = await uploadImage(images.filepath);
            if (product.images) {
                product.images.push({ 
                    url: secure_url, 
                    id: public_id 
                });
            }
            else {
                product.images = [{ 
                    url: secure_url, 
                    id: public_id 
                }];
            }
        }
    }

    // 11. 수정된 상품 정보 저장
    await product.save();

    // 12. 성공 응답 반환
    res.status(201).json({ message: "Product updated successfully." });

}