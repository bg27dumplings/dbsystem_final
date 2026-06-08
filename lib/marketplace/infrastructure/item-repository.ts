import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import { resolveStoredExchange } from "@/lib/marketplace/domain/exchange";
import type { MarketplaceItem } from "@/lib/marketplace/domain/models";
import { mapMarketplaceItem } from "@/lib/marketplace/domain/mappers";

type ItemRow = RowDataPacket & {
  id: number;
  title: string;
  description: string;
  exchange_note: string;
  condition_label: string;
  location: string;
  original_price: number;
  sale_price: number | null;
  status: MarketplaceItem["status"];
  category_name: string;
  seller_name: string;
  image_url: string | null;
};

type ItemImageRow = RowDataPacket & {
  item_id: number;
  public_url: string;
};

type ItemActionContextRow = RowDataPacket & {
  id: number;
  title: string;
  student_id: number;
  status: MarketplaceItem["status"];
  sale_price: number | null;
  exchange_note: string;
  location: string;
};

export type MarketplaceItemActionContext = {
  id: string;
  title: string;
  sellerId: number;
  status: MarketplaceItem["status"];
  exchangeMode: MarketplaceItem["exchangeMode"];
  exchangeLabel: string;
  exchangeValue?: string;
  location: string;
};

const SELECT_ITEM_FIELDS = `SELECT i.id, i.title, i.description, i.exchange_note, i.condition_label, i.location,
        i.original_price, i.sale_price, i.status, c.name AS category_name,
        s.name AS seller_name, img.public_url AS image_url
 FROM items i
 JOIN categories c ON c.id = i.category_id
 JOIN students s ON s.id = i.student_id
 LEFT JOIN item_images img ON img.item_id = i.id AND img.is_primary = 1`;

async function loadImagesByItemIds(itemIds: number[]) {
  if (itemIds.length === 0) {
    return new Map<number, string[]>();
  }

  const pool = getDbPool();
  const placeholders = itemIds.map(() => "?").join(", ");
  const [rows] = await pool.query<ItemImageRow[]>(
    `SELECT item_id, public_url
     FROM item_images
     WHERE item_id IN (${placeholders})
     ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    itemIds
  );

  const imagesMap = new Map<number, string[]>();
  for (const row of rows) {
    const current = imagesMap.get(row.item_id) ?? [];
    current.push(row.public_url);
    imagesMap.set(row.item_id, current);
  }

  return imagesMap;
}

async function mapRowsToItems(rows: ItemRow[]) {
  const imageMap = await loadImagesByItemIds(rows.map((row) => row.id));
  return rows.map((row) => mapMarketplaceItem(row, imageMap.get(row.id) ?? (row.image_url ? [row.image_url] : [])));
}

export async function findPublicMarketplaceItems() {
  const pool = getDbPool();
  const [rows] = await pool.query<ItemRow[]>(
    `${SELECT_ITEM_FIELDS}
     WHERE i.status IN ('active', 'reserved') AND s.status = 'active'
     ORDER BY i.created_at DESC`
  );

  return mapRowsToItems(rows);
}

export async function findMarketplaceItemById(itemId: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<ItemRow[]>(
    `${SELECT_ITEM_FIELDS}
     WHERE i.id = ? AND i.status IN ('active', 'reserved') AND s.status = 'active'
     LIMIT 1`,
    [itemId]
  );

  const [item] = await mapRowsToItems(rows);
  return item ?? null;
}

export async function findMarketplaceItemsByStudentId(studentId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<ItemRow[]>(
    `${SELECT_ITEM_FIELDS}
     WHERE i.student_id = ? AND i.status <> 'deleted'
     ORDER BY i.created_at DESC`,
    [studentId]
  );

  return mapRowsToItems(rows);
}

export async function findOwnedMarketplaceItemById(studentId: number, itemId: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<ItemRow[]>(
    `${SELECT_ITEM_FIELDS}
     WHERE i.id = ? AND i.student_id = ? AND i.status <> 'deleted'
     LIMIT 1`,
    [itemId, studentId]
  );

  const [item] = await mapRowsToItems(rows);
  return item ?? null;
}

export async function findMarketplaceItemActionContext(itemId: string): Promise<MarketplaceItemActionContext | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<ItemActionContextRow[]>(
    `SELECT i.id, i.title, i.student_id, i.status, i.sale_price, i.exchange_note, i.location
     FROM items i
     JOIN students s ON s.id = i.student_id
     WHERE i.id = ? AND i.status IN ('active', 'reserved') AND s.status = 'active'
     LIMIT 1`,
    [itemId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const exchange = resolveStoredExchange(null, null, row.sale_price === null ? null : Number(row.sale_price), row.exchange_note);

  return {
    id: String(row.id),
    title: row.title,
    sellerId: row.student_id,
    status: row.status,
    exchangeMode: exchange.exchangeMode,
    exchangeLabel: exchange.exchangeLabel,
    exchangeValue: exchange.exchangeValue,
    location: row.location
  };
}
