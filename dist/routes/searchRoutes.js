import express from "express";
import { getCategories, getSubcategories } from "../controllers/searchController.js";
const router = express.Router();
router.get("/categories", getCategories);
router.post("/subcategories", getSubcategories);
export default router;
//# sourceMappingURL=searchRoutes.js.map