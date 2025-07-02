import express, { NextFunction, Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler.utils";
import { prisma } from "../configs/db.config";

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

export const startQuizAttempt=async (req:Request,res:Response,next:NextFunction)=>{
  const userId=req.user?.id;
  const {quizId}=req.params;

  if(!quizId) return next(errorHandler(400,"Quiz id is required!"));
   try {
    const quiz=await prisma.quiz.findUnique({
      where:{id:quizId},
      include:{
        questions:{
          select:{
            id:true,
            text:true,
            options:{
              select:{
                id:true,
                text:true,
              },
            },
          },
        },
        tags:true,
      }
    });

    if(!quiz) return next(errorHandler(404,"Quiz not found!"));

    const existingAttempt=await prisma.quizAttempt.findFirst({
      where:{quizId,userId},
    });

    if(existingAttempt?.status==="COMPLETED"){
      return next(errorHandler(403,"You have already completed this quiz."));
    }

    const attempt =
      existingAttempt ??
      (await prisma.quizAttempt.create({
        data: {
          quizId,
          userId:userId as string,
          score: 0,
          status: "IN_PROGRESS",
        },
      }));

      res.json({
        quiz,
        attempt
      });
      return;
   } catch (error) {
    return next(errorHandler());
   }
}

export const submitQuizAttempt=async (req:Request,res:Response,next:NextFunction)=>{
   const userId=req.user?.id;
   const {quizId}=req.params;
   const {answers}=req.body;

   if(!quizId || !Array.isArray(answers) || answers.length===0){
    return next(errorHandler(400,"Invalid quiz submission!"));
   }

   try {
    const attempt=await prisma.quizAttempt.findFirst({
      where:{quizId,userId},
      include:{
        answers:true
      }
    });

    if (!attempt) return next(errorHandler(404, "Quiz attempt not found"));
    if (attempt.status === "COMPLETED") return next(errorHandler(403, "Quiz already submitted"));


    if (attempt.answers.length > 0) {
      await prisma.answer.deleteMany({
        where: { attemptId: attempt.id },
      });
    }

    let score = 0;

    for (const ans of answers) {
      const option = await prisma.option.findUnique({
        where: { id: ans.selectedOptionId },
      });
 
      if(!option) continue;

      await prisma.answer.create({
        data:{
          attemptId:attempt.id,
          questionId:ans.questionId,
          selectedOptionId:ans.selectedOptionId,
        },
      });

      score+=option.isCorrect?10:-4;
      }

      const updatedAttempt=await prisma.quizAttempt.update({
        where:{id:attempt.id},
        data:{
          status:"COMPLETED",
          score,
        },
      });

    res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      score: updatedAttempt.score,
    });

    return;
   } catch (error) {
    next(errorHandler());
   }
}

export const getQuizAttempDetails = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { quizId } = req.params;

  try {
    const attempt = await prisma.quizAttempt.findFirst({
      where: { quizId, userId },
      include: {
        quiz: {
          select: {
            name: true,
            topic: true,
          },
        },
        answers: {
          include: {
            selectedOption: true,
            question: {
              select: {
                id: true,
                text: true,
                review: true,
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) return next(errorHandler(404, "No attempt found for this quiz!"));

    const evaluatedAnswers = attempt.answers.map((answer) => {
      const isCorrect = answer.selectedOption.isCorrect;
      const correctOption = answer.question.options.find((opt) => opt.isCorrect);

      return {
        questionId: answer.question.id,
        questionText: answer.question.text,
        review: answer.question.review,
        selectedOption: answer.selectedOption.text,
        correctAnswer: correctOption?.text,
        isCorrect,
        scoreImpact: isCorrect ? 10 : -4,
        options: answer.question.options,
      };
    });

    const percentage = ((attempt.score / (evaluatedAnswers.length * 10)) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      quiz: attempt.quiz,
      totalScore: attempt.score,
      percentage,
      evaluatedAnswers,
    });
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
