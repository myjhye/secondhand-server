import { Router } from "express";
import { deleteProduct, deleteProductImage, getProductDetail, getProductsByCategory, listNewProduct, updateProduct } from "src/controllers/product";
import { isAuth } from "src/middleware/auth";
import fileParser from "src/middleware/fileParser";
import validate from "src/middleware/validator";
import { newProductSchema } from "src/utils/validationSchema";

const productRouter = Router();

productRouter.post("/list", isAuth, fileParser, validate(newProductSchema), listNewProduct); // 상품 등록
productRouter.patch("/:id", isAuth, fileParser, validate(newProductSchema), updateProduct); // 상품 수정
productRouter.delete("/:id", isAuth, deleteProduct); // 상품 삭제
productRouter.delete("/image/:productId/:imageId", isAuth, deleteProductImage); // 상품 이미지 삭제
productRouter.get("/detail/:productId", getProductDetail); // 단일 상품 정보 조회 (상세 페이지)
productRouter.get("/by-category/:category", getProductsByCategory); // 특정 카테고리에 속한 상품 조회

export default productRouter;