import express from "express";
import { createTopup, verifyTopup, getBalance, getTransactions } from "../controllers/walletController.js";
import { authUser, requireLegalAcceptance } from "../middlewares/auth.js";

const router = express.Router();

router.use(authUser);
router.use(requireLegalAcceptance("user"));

router.post("/topup", createTopup);
router.post("/verify", verifyTopup);
router.post("/balance", getBalance);
router.post("/transactions", getTransactions);

export default router;
