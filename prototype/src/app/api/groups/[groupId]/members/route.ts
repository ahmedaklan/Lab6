import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ groupId: string }> };
export async function POST(request: Request, { params }: Context) {
  const { groupId } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) return NextResponse.json({ error: "Enter a member name (up to 60 characters)." }, { status: 400 });
  if (!(await prisma.group.findUnique({ where: { id: groupId }, select: { id: true } }))) return NextResponse.json({ error: "Group not found." }, { status: 404 });
  const member = await prisma.member.create({ data: { name, groupId } });
  return NextResponse.json(member, { status: 201 });
}
