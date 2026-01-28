export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { SignupSchema } from "@/lib/auth/schemas";

type DbUserInsert = {
  email: string;
  name?: string | null;
  passwordHash: string;
  emailVerified: null;
  image: null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid signup payload" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const name = parsed.data.name?.trim() || null;

    const db = await getDb();
    const users = db.collection("users");

    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const doc: DbUserInsert = {
      email,
      name,
      passwordHash,
      emailVerified: null,
      image: null,
    };

    await users.insertOne(doc);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
