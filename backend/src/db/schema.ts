import { pool } from "./database.js";

export async function tableExists(tableName: string): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    "SELECT to_regclass($1) IS NOT NULL AS exists",
    [`public.${tableName}`]
  );

  return result.rows[0]?.exists ?? false;
}

export async function getTableColumns(tableName: string): Promise<string[]> {
  const result = await pool.query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

export function pickExistingColumn(
  columns: string[],
  candidates: string[]
): string | null {
  return candidates.find((candidate) => columns.includes(candidate)) ?? null;
}
