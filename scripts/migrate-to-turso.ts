import "dotenv/config";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client/web";
import path from "path";

const localDb = new Database(path.join(process.cwd(), "dev.db"));
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrateTable(table: string) {
  const rows = localDb.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[];
  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows (skip)`);
    return;
  }

  const columns = Object.keys(rows[0]);
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT OR IGNORE INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`;

  let count = 0;
  // Batch in groups of 20
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20);
    const statements = batch.map((row) => ({
      sql,
      args: columns.map((c) => {
        const val = row[c];
        if (val === null || val === undefined) return null;
        if (typeof val === "boolean") return val ? 1 : 0;
        return val as string | number;
      }),
    }));

    try {
      await turso.batch(statements, "write");
      count += batch.length;
    } catch (err) {
      // Try one by one on batch failure
      for (const stmt of statements) {
        try {
          await turso.execute(stmt);
          count++;
        } catch (e) {
          console.log(`  Skipped row in ${table}: ${(e as Error).message?.slice(0, 80)}`);
        }
      }
    }
  }
  console.log(`  ${table}: ${count}/${rows.length} rows migrated`);
}

async function main() {
  console.log("Migrating local SQLite to Turso...\n");

  // Order matters for foreign keys
  await migrateTable("Creator");
  await migrateTable("Tweet");
  await migrateTable("TrendleTweet");
  await migrateTable("Interaction");
  await migrateTable("Referral");
  await migrateTable("SyncLog");

  console.log("\nDone! Verifying...");

  const result = await turso.execute("SELECT COUNT(*) as c FROM Creator");
  console.log(`Creators on Turso: ${result.rows[0].c}`);
  const tweets = await turso.execute("SELECT COUNT(*) as c FROM Tweet WHERE mentionsTrendle = 1");
  console.log(`Trendle tweets on Turso: ${tweets.rows[0].c}`);
  const refs = await turso.execute("SELECT COUNT(*) as c FROM Referral");
  console.log(`Referrals on Turso: ${refs.rows[0].c}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
