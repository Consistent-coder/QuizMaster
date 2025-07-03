import express, { NextFunction, Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler.utils";
import { prisma } from "../configs/db.config";
import { getAIGeneratedQuestions } from "../configs/gemini.config";
import { askGemini } from "../utils/gemini.utils";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/tokens.config";

interface QuizInput {
  name: string;
  description?: string | undefined;
  topic: string;
  tags: string[];
  questions: {
    text: string;
    review?: string;
    options: {
      text: string;
      isCorrect: boolean;
    }[];
  }[];
}

export const createQuiz = async (req: Request, res: Response, next: NextFunction) => {
  const { name, description, topic, questions, tags }: QuizInput = req.body;

  if (!name || !topic) {
    return next(errorHandler(400, "All fields are required!"));
  }

  if (!questions || !Array.isArray(questions) || questions.length <= 0) {
    return next(errorHandler(400, "Quiz must have at least one question."));
  }

  for (const question of questions) {
    const correctOptions = question.options.filter((opt) => opt.isCorrect);
    if (question.options.length < 2 || correctOptions.length !== 1) {
      return next(
        errorHandler(
          400,
          "Each question must have at least 2 options and exactly 1 correct answer."
        )
      );
    }
  }

  try {
    const quiz = await prisma.quiz.create({
      data: {
        name,
        description: description || "",
        topic,
        createdById: req.user!.id,

        questions: {
          create: questions.map((q) => ({
            text: q.text,
            review: q.review || null,
            options: {
              create: q.options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },

        tags: {
          connectOrCreate: tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },

      include: {
        questions: {
          include: { options: true },
        },
        tags: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      quiz,
    });
    return;
  } catch (error) {
    console.log(error);
    
    return next(errorHandler(500, "Quiz creation failed"));
  }
};


export const getAllQuizzes=async (req:Request,res:Response,next:NextFunction)=>{
  const {searchTerm}=req.query;
  console.log(searchTerm);
  
  try {
    const quizzes=await prisma.quiz.findMany({
      where:(searchTerm && (searchTerm as string).length>0) ? {
        OR:[
          {
            name: {
              contains: searchTerm as string,
              mode: 'insensitive',
            }
          },
          {
            description:{
              contains:searchTerm as string,
              mode:'insensitive',
            }
          },
          {
            tags:{
              some:{
                name:{
                  contains:searchTerm as string,
                  mode : 'insensitive'
                }
              }
            }
          }
        ]
      }:undefined,
      include:{
        createdBy:{select:{name:true}},
        tags:true,
        questions:{
          select:{id:true},
        },
      }
    });

    const formattedQuiz=quizzes.map((quiz)=>({
      id:quiz.id,
      name:quiz.name,
      // tags:quiz.tags.map((t)=>t.name),
      tags:[...quiz.tags],
      topic:quiz.topic,
      createdBy:quiz.createdBy,
      questionCount:quiz.questions.length,
    }));

    res.json({
      success:true,
      quizzes:formattedQuiz,
    });
    return;
  } catch (error) {
   return next(errorHandler()); 
  }
}

export const startQuizAttempt = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { quizId } = req.params;

  if (!quizId) return next(errorHandler(400, "Quiz ID is required!"));

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            options: {
              select: { id: true, text: true },
            },
          },
        },
        tags: true,
      },
    });

    if (!quiz) return next(errorHandler(404, "Quiz not found!"));

    let attempt:any = await prisma.quizAttempt.findFirst({
      where: { quizId, userId },
      include: {
        answers: true,
      },
    });

    if (attempt?.status === "COMPLETED") {
      console.log("entered");
      
      next(errorHandler(403, "You have already completed this quiz."));
      return;
    }

    if (!attempt) {
      attempt = await prisma.quizAttempt.create({
        data: {
          quizId,
          userId: userId as string,
          score: 0,
          status: "IN_PROGRESS",
        },
      });
    }

    const savedAnswers = attempt.answers.reduce((acc: any, ans:any) => {
      acc[ans.questionId] = ans.selectedOptionId;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      quiz,
      attemptId: attempt.id,
      savedAnswers,
    });
  } catch (error) {
    return next(errorHandler());
  }
};


export const submitQuizAttempt = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { quizId } = req.params;
  const { answers } = req.body;

  if (!quizId || !Array.isArray(answers) || answers.length === 0) {
    return next(errorHandler(400, "Invalid quiz submission!"));
  }

  try {
    const attempt = await prisma.quizAttempt.findFirst({
      where: { quizId, userId },
      include: { answers: true },
    });

    if (!attempt) return next(errorHandler(404, "Quiz attempt not found"));
    if (attempt.status === "COMPLETED") return next(errorHandler(403, "Quiz already submitted"));

    if (attempt.answers.length > 0) {
      await prisma.answer.deleteMany({ where: { attemptId: attempt.id } });
    }

    let score = 0;

    for (const ans of answers) {
      const option = await prisma.option.findUnique({ where: { id: ans.selectedOptionId } });
      if (!option) continue;

      await prisma.answer.create({
        data: {
          attemptId: attempt.id,
          questionId: ans.questionId,
          selectedOptionId: ans.selectedOptionId,
        },
      });

      score += option.isCorrect ? 10 : -4;
    }

    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "COMPLETED",
        score,
      },
    });

    res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      score: updatedAttempt.score,
    });
  } catch (error) {
    next(errorHandler());
  }
};


export const getQuizAttemptDetails = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { quizId } = req.params;

  try {
    const attempt = await prisma.quizAttempt.findFirst({
      where: { quizId, userId },
    });

    if (!attempt) return next(errorHandler(404, "No attempt found for this quiz!"));

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        name: true,
        topic: true,
        questions: {
          select: {
            id: true,
            text: true,
            review: true,
            options: true,
          },
        },
      },
    });

    const answers = await prisma.answer.findMany({
      where: { attemptId: attempt.id },
      include: {
        selectedOption: true,
      },
    });

    const answerMap = new Map<string, any>();
    for (const ans of answers) {
      answerMap.set(ans.questionId, ans);
    }

    const evaluatedAnswers:any = quiz?.questions.map((question) => {
      const answer = answerMap.get(question.id);
      const selectedOption = answer?.selectedOption ?? null;
      const correctOption = question.options.find((opt) => opt.isCorrect);

      return {
        questionId: question.id,
        questionText: question.text,
        review: question.review,
        selectedOption: selectedOption?.text || null,
        correctAnswer: correctOption?.text || "N/A",
        isCorrect: selectedOption?.id === correctOption?.id,
        scoreImpact:
          selectedOption == null
            ? 0
            : selectedOption.id === correctOption?.id
            ? 10
            : -4,
        options: question.options,
      };
    });

    const totalScore = evaluatedAnswers.reduce((acc:number, q:any) => acc + q.scoreImpact, 0);
    const percentage = (
      (totalScore / (evaluatedAnswers.length * 10)) *
      100
    ).toFixed(2);

    res.status(200).json({
      success: true,
      quiz: {
        name: quiz?.name,
        topic: quiz?.topic,
      },
      totalScore,
      percentage,
      evaluatedAnswers,
    });
  } catch (error) {
    next(errorHandler());
  }
};


export const saveProgress = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { quizId } = req.params;
  const { answers } = req.body;

  try {
    const attempt = await prisma.quizAttempt.findFirst({
      where: { quizId, userId },
    });

    if (!attempt) return next(errorHandler(404, "Attempt not found"));
    if (attempt.status === "COMPLETED") return next(errorHandler(403, "Already submitted"));

    await prisma.answer.deleteMany({ where: { attemptId: attempt.id } });

    for (const ans of answers) {
      await prisma.answer.create({
        data: {
          attemptId: attempt.id,
          questionId: ans.questionId,
          selectedOptionId: ans.selectedOptionId,
        },
      });
    }

    res.status(200).json({ success: true, message: "Progress saved!" });
  } catch (error) {
    next(errorHandler());
  }
};


export const getQuizzesByAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const adminId = req.user?.id;

  try {
    const quizzes = await prisma.quiz.findMany({
      where: { createdById: adminId },
      include: {
        tags: true,
        questions: { select: { id: true } },
      },
    });

    res.json({ success: true, quizzes });
  } catch (error) {
    return next(errorHandler(500, "Failed to fetch admin quizzes."));
  }
};


export const generateAiQuestions=async (req:Request,res:Response,next:NextFunction)=>{
  try {
    const topic=req.body.topic || "trivia";
    const numberOfQuestions=req.body.numberOfQuestions || 3;
    console.log(topic,numberOfQuestions);
    
     const generatedQuestions=await getAIGeneratedQuestions({topic,numberOfQuestions});

     res.json({
      msg:"Questions generated successfully!",
      generatedQuestions,
     });
     return;
  } catch (error) {
    return next(errorHandler());
  }
}


export const askReviewBot = async (req: Request, res: Response, next: NextFunction) => {
  console.log("Entering to ask review bot!.");
  
  const { quizId } = req.params;
  const message = req.body.message;
  const token = req.headers.authorization?.split(' ')[1];
  if (!quizId || !message || !token) return next(new Error('Missing parameters'));

  let userId: string;
  try {
    userId = (jwt.verify(token, process.env.JWT_SECRET!) as any).id;
  } catch {
    return next(new Error('Invalid token'));
  }

  const attempt = await prisma.quizAttempt.findFirst({
    where: { quizId, userId },
    include: { answers: { include: { selectedOption: true, question: { include: { options: true } } } } },
  });
  if (!attempt) return next(new Error('No quiz attempt'));

  const context = attempt.answers.map((ans, i) => {
    const correct = ans.question.options.find(o => o.isCorrect)?.text;
    return `Q${i + 1}: ${ans.question.text}
Your answer: ${ans.selectedOption?.text || 'none'}
Correct: ${correct}
Review: ${ans.question.review || '—'}`;
  }).join('\n---\n');

  await prisma.chatMessage.create({ data: { userId, quizId, role: 'user', content: message } });

  const prompt = `You are QuizMaster's AI assistant made by QuizMaster. Based strictly on context:
${context}

User: ${message}
Assistant:`;
  try {
    const reply = await askGemini(prompt);
    await prisma.chatMessage.create({ data: { userId, quizId, role: 'assistant', content: reply } });
    res.json({ reply });
  } catch (e) {
    console.error('Gemini error', e);
    next(new Error('Chatbot error'));
  }
};



export const getChatHistory = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { quizId } = req.params;

  if (!userId || !quizId) return next(errorHandler(400, 'Missing IDs'));

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId, quizId },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error(err);
    next(errorHandler(500, 'Failed to fetch chat history'));
  }
};


export const getUserInProgressQuizzes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId, status: 'IN_PROGRESS' },
      include: { quiz: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(attempts.map(a => ({
      id: a.quiz.id,
      name: a.quiz.name,
      topic: a.quiz.topic,
      startedAt: a.createdAt
    })));
  } catch (err) {
    next(err);
  }
};

export const getUserCompletedQuizzes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { quiz: true },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(attempts.map(a => ({
      id: a.quiz.id,
      name: a.quiz.name,
      topic: a.quiz.topic,
      score: a.score,
      completedAt: a.updatedAt
    })));
  } catch (err) {
    next(err);
  }
};

export const getUserQuizStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const [completed, inProgress] = await Promise.all([
      prisma.quizAttempt.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.quizAttempt.count({ where: { userId, status: 'IN_PROGRESS' } })
    ]);

    res.json({ completed, inProgress });
  } catch (err) {
    next(err);
  }
};
