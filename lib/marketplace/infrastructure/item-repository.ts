import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import { resolveStoredExchange } from "@/lib/marketplace/domain/exchange";
import type { EditableMarketplaceItem, MarketplaceItem } from "@/lib/marketplace/domain/models";
import { mapEditableMarketplaceItem, mapMarketplaceItem } from "@/lib/marketplace/domain/mappers";

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
  seller_id: number;
  image_url: string | null;
};

type ItemImageRow = RowDataPacket & {
  item_id: number;
  public_url: string;
};

type EditableItemRow = RowDataPacket & {
  id: number;
  title: string;
  description: string;
  exchange_note: string;
  condition_label: string;
  location: string;
  sale_price: number | null;
  status: MarketplaceItem["status"];
  category_id: number;
};

type EditableItemImageRow = RowDataPacket & {
  id: number;
  item_id: number;
  storage_path: string;
  public_url: string;
  alt_text: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
  is_primary: number;
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

export type MarketplaceOwnedItemImageRecord = {
  id: number;
  itemId: number;
  storagePath: string;
  publicUrl: string;
  altText: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  isPrimary: boolean;
};

const SELECT_ITEM_FIELDS = `SELECT i.id, i.title, i.description, i.exchange_note, i.condition_label, i.location,
        i.original_price, i.sale_price, i.status, c.name AS category_name,
        s.name AS seller_name, i.student_id AS seller_id, img.public_url AS image_url
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

export async function findPublicMarketplaceItems(filter?: {
  keyword?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const pool = getDbPool();
  let sql = `${SELECT_ITEM_FIELDS}
     WHERE i.status IN ('active', 'reserved') AND s.status = 'active'`;
  const params: any[] = [];

  if (filter) {
    if (filter.keyword && filter.keyword.trim() !== "") {
      const keywordPattern = `%${filter.keyword.trim()}%`;
      sql += ` AND (i.title LIKE ? OR i.description LIKE ?)`;
      params.push(keywordPattern, keywordPattern);
    }
    if (filter.categoryId && filter.categoryId.trim() !== "" && filter.categoryId !== "all") {
      sql += ` AND i.category_id = ?`;
      params.push(filter.categoryId);
    }
    if (filter.minPrice !== undefined && filter.minPrice !== null && !isNaN(filter.minPrice)) {
      sql += ` AND i.sale_price >= ?`;
      params.push(filter.minPrice);
    }
    if (filter.maxPrice !== undefined && filter.maxPrice !== null && !isNaN(filter.maxPrice)) {
      sql += ` AND i.sale_price <= ?`;
      params.push(filter.maxPrice);
    }
  }

  sql += ` ORDER BY i.created_at DESC`;

  const [rows] = await pool.query<ItemRow[]>(sql, params);

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

export async function findEditableMarketplaceItemById(studentId: number, itemId: string): Promise<EditableMarketplaceItem | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<EditableItemRow[]>(
    `SELECT id, title, description, exchange_note, condition_label, location, sale_price, status, category_id
     FROM items
     WHERE id = ? AND student_id = ?
     LIMIT 1`,
    [itemId, studentId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const [imageRows] = await pool.execute<EditableItemImageRow[]>(
    `SELECT id, item_id, storage_path, public_url, alt_text, mime_type, file_size, sort_order, is_primary
     FROM item_images
     WHERE item_id = ?
     ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    [itemId]
  );

  return mapEditableMarketplaceItem(row, imageRows);
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

export async function findOwnedMarketplaceItemActionContext(studentId: number, itemId: string): Promise<MarketplaceItemActionContext | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<ItemActionContextRow[]>(
    `SELECT i.id, i.title, i.student_id, i.status, i.sale_price, i.exchange_note, i.location
     FROM items i
     JOIN students s ON s.id = i.student_id
     WHERE i.id = ? AND i.student_id = ? AND s.status = 'active'
     LIMIT 1`,
    [itemId, studentId]
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

export async function findOwnedMarketplaceItemImages(studentId: number, itemId: string): Promise<MarketplaceOwnedItemImageRecord[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute<EditableItemImageRow[]>(
    `SELECT img.id, img.item_id, img.storage_path, img.public_url, img.alt_text, img.mime_type, img.file_size, img.sort_order, img.is_primary
     FROM item_images img
     JOIN items i ON i.id = img.item_id
     WHERE img.item_id = ? AND i.student_id = ?
     ORDER BY img.is_primary DESC, img.sort_order ASC, img.id ASC`,
    [itemId, studentId]
  );

  return rows.map((row) => ({
    id: row.id,
    itemId: row.item_id,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    altText: row.alt_text,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    sortOrder: row.sort_order,
    isPrimary: row.is_primary === 1
  }));
}
