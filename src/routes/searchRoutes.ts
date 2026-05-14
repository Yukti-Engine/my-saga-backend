import express from "express";
import { getSpaces, getCategories, getSubcategories, findLobbies, getBadges, getProfile, getTicketStatus, getMyTickets, closeMyTicket } from "../controllers/searchController.js";
import { authAny } from "../middlewares/auth.js";

const router = express.Router();
router.post("/spaces", authAny, getSpaces);
router.post("/lobbies", authAny, findLobbies);
router.post("/categories", authAny, getCategories);
router.post("/subcategories", authAny, getSubcategories);
router.post("/badges", authAny, getBadges);
router.post("/profile", authAny, getProfile);
router.post("/get-ticket-status", authAny, getTicketStatus);
router.post("/my-tickets", authAny, getMyTickets);
router.post("/close-ticket", authAny, closeMyTicket);
export default router;
