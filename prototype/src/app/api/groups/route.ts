import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      members: { orderBy: { createdAt: "asc" } },
      expenses: { include: { payer: true, participants: { include: { member: true } } } },
    },
  });
  return NextResponse.json(groups.map((group) => ({
    ...group,
    balances: group.members.map((member) => {
      const paid = group.expenses.filter((expense) => expense.payerId === member.id).reduce((sum, expense) => sum + expense.amountCents, 0);
      const share = group.expenses.flatMap((expense) => expense.participants).filter((item) => item.memberId === member.id).reduce((sum, item) => sum + item.amountCents, 0);
      return { memberId: member.id, cents: paid - share };
    }),
  })));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) return NextResponse.json({ error: "Enter a group name (up to 60 characters)." }, { status: 400 });
  const group = await prisma.group.create({ data: { name } });
  return NextResponse.json(group, { status: 201 });
}
