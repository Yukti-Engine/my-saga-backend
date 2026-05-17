import express from "express";
import { getIssuer, getBadgeClass, getAssertion } from "../controllers/obController.js";

const router = express.Router();

router.get("/issuer", getIssuer);
router.get("/badges/:badgeId", getBadgeClass);
router.get("/assertions/:assertionId", getAssertion);

export default router;
