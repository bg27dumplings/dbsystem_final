import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import type { MarketplaceCategory } from "@/lib/marketplace/domain/models";

type CategoryRow = RowDataPacket & {
  id: number;
  name: string;
  slug: string;
};

export async function findActiveMarketplaceCategories() {
  const pool = getDbPool();
  const [rows] = await pool.query<CategoryRow[]>(
    `SELECT id, name, slug
     FROM categories
     WHERE status = 'active'
     ORDER BY sort_order ASC, id ASC`
  );

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    slug: row.slug
  })) satisfies MarketplaceCategory[];
}
