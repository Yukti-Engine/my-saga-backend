import express from "express";
import { getCategories, getSubcategories } from "../controllers/searchController.js";
const router = express.Router();
router.post("/categories", getCategories);
router.post("/subcategories", getSubcategories);
export default router;
//# sourceMappingURL=searchRoutes.js.map