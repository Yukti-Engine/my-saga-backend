import express from "express";
import { getCategories, getSubcategories, findLobbies, getBadges, getProfile } from "../controllers/searchController.js";
import { authAny } from "../middlewares/auth.js";

const router = express.Router();
router.post("/lobbies", authAny, findLobbies);
router.post("/categories", authAny, getCategories);
router.post("/subcategories", authAny, getSubcategories);
router.post("/badges", authAny, getBadges);
router.post("/profile", authAny, getProfile);
export default router;
