import { getDb } from "@/lib/mongodb";
import type { ObjectId } from "mongodb";

type WhatsAppVerificationDoc = {
  _id: string; // `${userId}:${phone}`
  userId: ObjectId;
  phone: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function ensureWhatsAppIndexes() {
  const db = await getDb();
  const ver = db.collection<WhatsAppVerificationDoc>("whatsapp_verifications");

  await ver.createIndex({ userId: 1, phone: 1 }, { unique: true, name: "uniq_user_phone" });
  await ver.createIndex({ expiresAt: 1 }, { name: "ttl_expires_at" });
}
