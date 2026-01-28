import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI. Add it to .env.local");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise!; // ✅ non-null assertion after init
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB?.trim();
  return dbName ? client.db(dbName) : client.db();
}
