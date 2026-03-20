import express from "express";
import { getCategories, getSubcategories, getOffers, generateAdventureName, findLobbies, getBadges, getProfile } from "../controllers/searchController.js";
import { authAny, authUser, authOrganizer } from "../middlewares/auth.js";

const router = express.Router();
router.post("/lobbies", authAny, findLobbies);
router.post("/categories", authAny, getCategories);
router.post("/subcategories", authAny, getSubcategories);
router.post("/offers", authUser, getOffers);
router.post("/badges", authAny, getBadges);
router.post("/random-adventure-name", authOrganizer, generateAdventureName);
router.post("/profile", authAny, getProfile);
export default router;
