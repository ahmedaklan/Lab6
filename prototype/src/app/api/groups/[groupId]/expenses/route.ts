import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAmountToCents, splitCents } from "@/lib/money";

type Context = { params: Promise<{ groupId: string }> };
export async function POST(request: Request, { params }: Context) {
  const { groupId } = await params;
  const body = await request.json().catch(() => null);
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const amountCents = parseAmountToCents(body?.amount);
  const payerId = typeof body?.payerId === "string" ? body.payerId : "";
  const participantIds = Array.isArray(body?.participantIds) && body.participantIds.every((id: unknown) => typeof id === "string") ? [...new Set(body.participantIds as string[])] : [];
  if (!description || description.length > 100) return NextResponse.json({ error: "Enter a description (up to 100 characters)." }, { status: 400 });
  if (amountCents === null) return NextResponse.json({ error: "Enter a positive amount with up to two decimal places." }, { status: 400 });
  if (!payerId || participantIds.length === 0) return NextResponse.json({ error: "Choose a payer and at least one participant." }, { status: 400 });
  const members = await prisma.member.findMany({ where: { id: { in: [payerId, ...participantIds] }, groupId }, select: { id: true } });
  if (members.length !== new Set([payerId, ...participantIds]).size) return NextResponse.json({ error: "The payer and every participant must belong to this group." }, { status: 400 });
  const shares = splitCents(amountCents, participantIds.length);
  const expense = await prisma.expense.create({ data: {
    description, amountCents, groupId, payerId,
    participants: { create: participantIds.map((memberId, index) => ({ memberId, amountCents: shares[index] })) },
  }, include: { payer: true, participants: { include: { member: true } } } });
  return NextResponse.json(expense, { status: 201 });
}
