import express from "express";
import { count, updatePollAddVote,updatePollRemoveVote, createPoll, getEvent, getMessages, getPoll, insertResult, getResult} from "../controllers/adventureController.js";

const router = express.Router();

router.post("/count", count);
router.post("/get-messages", getMessages);
router.post("/get-event", getEvent);
router.post("/create-poll", createPoll);
router.post("/update-poll-add-vote", updatePollAddVote);
router.post("/update-poll-remove-vote", updatePollRemoveVote);
router.post("/get-poll", getPoll);
router.post("/insert-result", insertResult);
router.post("/get-result", getResult);
export default router;
