import express from "express";
import { getCategories, getSubcategories, getOffers, generateAdventureName, findLobbies, getBadges } from "../controllers/searchController.js";

const router = express.Router();
router.post("/lobbies", findLobbies);
router.post("/categories", getCategories);
router.post("/subcategories", getSubcategories);
router.post("/offers", getOffers);
router.post("/badges", getBadges);
router.post("/random-adventure-name", generateAdventureName);
export default router;
