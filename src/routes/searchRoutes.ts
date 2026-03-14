import express from "express";
import { getCategories, getSubcategories, getOffers, generateAdventureName } from "../controllers/searchController.js";

const router = express.Router();

router.post("/categories", getCategories);
router.post("/subcategories", getSubcategories);
router.post("/offers", getOffers);
router.post("/random-adventure-name", generateAdventureName);
export default router;
