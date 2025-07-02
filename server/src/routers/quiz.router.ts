import express from "express";
import { createQuiz, getAllQuizzes, getQuizAttempDetails, getQuizzesByAdmin, startQuizAttempt, submitQuizAttempt } from "../controllers/quiz.controller";
import { isAdmin, verifyJwtToken } from "../middlewares/auth.middleware";

const router=express.Router();

router.post("/create",verifyJwtToken,isAdmin,createQuiz);
router.post("/:quizId/start",verifyJwtToken,startQuizAttempt);
router.post("/:quizId/submit",submitQuizAttempt);

router.get("/all",getAllQuizzes);
router.get("/admin",verifyJwtToken,isAdmin,getQuizzesByAdmin);
router.get("/:quizId/attempt",getQuizAttempDetails);

export const quizRouter=router;