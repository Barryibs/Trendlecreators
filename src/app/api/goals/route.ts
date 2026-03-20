import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const goals = await prisma.weeklyGoal.findMany({
    orderBy: [{ weekStart: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  try {
    const { weekStart, title } = await request.json();
    if (!weekStart || !title) {
      return NextResponse.json(
        { error: "weekStart and title are required" },
        { status: 400 }
      );
    }

    const goal = await prisma.weeklyGoal.create({
      data: { weekStart, title },
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, completed } = await request.json();
    const goal = await prisma.weeklyGoal.update({
      where: { id },
      data: { completed },
    });
    return NextResponse.json(goal);
  } catch {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await prisma.weeklyGoal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }
}
