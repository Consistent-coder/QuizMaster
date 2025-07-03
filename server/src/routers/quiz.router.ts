import express from "express";
import { askReviewBot, createQuiz, generateAiQuestions, getAllQuizzes, getChatHistory, getQuizAttemptDetails, getQuizzesByAdmin, getUserCompletedQuizzes, getUserInProgressQuizzes, getUserQuizStats, saveProgress, startQuizAttempt, submitQuizAttempt } from "../controllers/quiz.controller";
import { isAdmin, verifyJwtToken } from "../middlewares/auth.middleware";

const router=express.Router();

router.post("/create",verifyJwtToken,isAdmin,createQuiz);
router.post("/generate",verifyJwtToken,isAdmin,generateAiQuestions);
router.post("/:quizId/submit",verifyJwtToken,submitQuizAttempt);
router.post("/:quizId/save-progress",verifyJwtToken,saveProgress);
router.post("/:quizId/chat", askReviewBot);

router.get("/:quizId/start",verifyJwtToken,startQuizAttempt);
router.get("/all",getAllQuizzes);
router.get("/admin",verifyJwtToken,isAdmin,getQuizzesByAdmin);
router.get("/:quizId/attempt",verifyJwtToken,getQuizAttemptDetails);
router.get("/:quizId/chat",verifyJwtToken,getChatHistory);
router.get('/u/in-progress', verifyJwtToken, getUserInProgressQuizzes);
router.get('/u/completed', verifyJwtToken, getUserCompletedQuizzes);
router.get('/u/stats', verifyJwtToken, getUserQuizStats);
export const quizRouter=router;