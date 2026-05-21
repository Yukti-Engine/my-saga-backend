import express from "express";
import { count, updatePollAddVote, updatePollRemoveVote, createPoll, getEvent, getMessages, getPoll, insertResult, getResult, getUploadFileUrl, getDownloadFileUrl } from "../controllers/adventureController.js";
import { authAny, authBoss } from "../middlewares/auth.js";

const router = express.Router();

router.post("/count", authAny, count);
router.post("/get-messages", authAny, getMessages);
router.post("/get-event", authAny, getEvent);
router.post("/create-poll", authAny, createPoll);
router.post("/update-poll-add-vote", authAny, updatePollAddVote);
router.post("/update-poll-remove-vote", authAny, updatePollRemoveVote);
router.post("/get-poll", authAny, getPoll);
router.post("/insert-result", authBoss, insertResult);
router.post("/get-result", authAny, getResult);
router.post("/upload-url", authAny, getUploadFileUrl);
router.post("/download-url", authAny, getDownloadFileUrl);
export default router;
