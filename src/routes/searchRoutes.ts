import express from "express";
import { getCategories, getSubcategories, getOffers, generateAdventureName, findLobbies, getBadges, getProfile } from "../controllers/searchController.js";

const router = express.Router();
router.post("/lobbies", findLobbies);
router.post("/categories", getCategories);
router.post("/subcategories", getSubcategories);
router.post("/offers", getOffers);
router.post("/badges", getBadges);
router.post("/random-adventure-name", generateAdventureName);
router.post("/profile", getProfile);
export default router;
