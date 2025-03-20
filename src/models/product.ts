import { Document, Schema, model } from "mongoose";
import categories from "src/utils/categories";

// 1. 상품 이미지 타입 정의
type productImage = { 
    url: string; // 이미지 URL
    id: string // 이미지 식별 ID (클라우드 저장소 등에서 사용)
};

export interface ProductDocument extends Document {
    owner: Schema.Types.ObjectId; // 상품 소유자 ID
    name: string; // 상품명
    price: number; // 가격
    purchasingDate: Date; // 구매 일자
    category: string; // 카테고리
    images?: productImage[]; // 상품 이미지 배열 (선택적)
    thumbnail?: string; // 썸네일 이미지 URL (선택적)
    description: string; // 상품 설명
}


// 2. 상품 스키마 정의 (상품 정보)
const productSchema = new Schema<ProductDocument>(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User", // User 모델 참조 (관계 설정)
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true, // 앞뒤 공백 제거
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
        },
        category: {
            type: String,
            enum: [...categories], // 미리 정의된 카테고리 목록으로 제한
            required: true,
        },
        purchasingDate: {
            type: Date,
            required: true,
        },
        images: [
            {
              url: { type: String },
              id: { type: String }
            }
          ],
        thumbnail: String,
    },
    { 
        timestamps: true // createdAt, updatedAt 자동 생성
    },
);


const ProductModel = model("Product", productSchema);

export default ProductModel;