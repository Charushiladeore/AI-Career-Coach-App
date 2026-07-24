"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

export async function generateCoverLetter(data) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const prompt = `
Write a professional cover letter for the role of ${
    data.jobTitle
  } at ${data.companyName}.

Candidate Information:
- Industry: ${user.industry}
- Experience: ${user.experience}
- Skills: ${user.skills?.join(", ")}
- Bio: ${user.bio}

Job Description:
${data.jobDescription}

Requirements:
1. Professional and enthusiastic tone
2. Highlight relevant skills and achievements
3. Keep it under 400 words
4. Use markdown formatting
`;

  let content = "";

  try {
    const result = await model.generateContent(prompt);

    content = result.response.text().trim();
  } catch (error) {
    console.error("Gemini API Error:", error.message);

    // Fallback content if Gemini quota fails
    content = `
# Cover Letter

Dear Hiring Manager,

I am excited to apply for the ${
      data.jobTitle
    } position at ${data.companyName}.

I am a motivated professional with experience in ${
      user.industry
    }. My technical background includes skills in ${user.skills?.join(", ")}.

I am confident that my problem-solving abilities, technical expertise, and passion for software development will allow me to contribute effectively to your organization.

Thank you for your consideration. I look forward to discussing my qualifications further.

Sincerely,  
${user.name}
`;
  }

  const coverLetter = await db.coverLetter.create({
    data: {
      content,
      jobDescription: data.jobDescription,
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      status: "completed",
      userId: user.id,
    },
  });

  return coverLetter;
}

export async function getCoverLetters() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return await db.coverLetter.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteCoverLetter(id) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}