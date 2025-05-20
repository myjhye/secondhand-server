import { Router } from "express";
import { askAiAboutProduct, deleteProduct, deleteProductImage, getLatestProducts, getListings, getProductDetail, getProductsByCategory, listNewProduct, searchProducts, updateProduct } from "src/controllers/product";
import { isAuth } from "src/middleware/auth";
import fileParser from "src/middleware/fileParser";
import validate from "src/middleware/validator";
import { newProductSchema } from "src/utils/validationSchema";

const productRouter = Router();

productRouter.post("/list", isAuth, fileParser, validate(newProductSchema), listNewProduct); // 상품 등록
productRouter.patch("/:id", isAuth, fileParser, validate(newProductSchema), updateProduct); // 상품 수정
productRouter.delete("/:id", isAuth, deleteProduct); // 특정 상품 삭제
productRouter.delete("/image/:productId/:imageId", isAuth, deleteProductImage); // 상품 이미지 삭제
productRouter.get("/detail/:productId", getProductDetail); // 상품 상세 정보 조회
productRouter.get("/by-category/:category", getProductsByCategory); // 카테고리별 상품 목록 조회
productRouter.get("/latest", getLatestProducts); // 최신 상품 10개 조회 (홈 용)
productRouter.get("/listings", isAuth, getListings); // 내 등록 상품 목록 조회 (마이페이지)
productRouter.get("/search", isAuth, searchProducts); // 상품 검색
productRouter.post("/ask-ai", isAuth, askAiAboutProduct); // 상품 질문 (GPT 기반)

export default productRouter;