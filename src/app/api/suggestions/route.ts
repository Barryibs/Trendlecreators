import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const suggestions = await prisma.suggestion.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suggestions);
}

export async function POST(request: NextRequest) {
  try {
    const { author, category, text } = await request.json();
    if (!author || !text) {
      return NextResponse.json(
        { error: "author and text are required" },
        { status: 400 }
      );
    }

    const suggestion = await prisma.suggestion.create({
      data: { author, category: category || "general", text },
    });
    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create suggestion" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    const suggestion = await prisma.suggestion.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(suggestion);
  } catch {
    return NextResponse.json(
      { error: "Suggestion not found" },
      { status: 404 }
    );
  }
}
