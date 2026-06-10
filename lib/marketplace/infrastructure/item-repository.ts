import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import { resolveStoredExchange } from "@/lib/marketplace/domain/exchange";
import type { MarketplaceItem, MarketplaceItemFilters } from "@/lib/marketplace/domain/models";
import { mapMarketplaceItem } from "@/lib/marketplace/domain/mappers";
import { countAcceptedAppointmentsForItem } from "@/lib/marketplace/application/item-availability-service";

type ItemRow = RowDataPacket & {
  id: number;
  title: string;
  description: string;
  exchange_note: string;
  condition_label: string;
  location: string;
  quantity: number;
  location_x: number | null;
  location_y: number | null;
  original_price: number;
  sale_price: number | null;
  status: MarketplaceItem["status"];
  category_id: number;
  category_name: string;
  student_id: number;
  seller_name: string;
  seller_bio: string | null;
  seller_avatar_url: string | null;
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
  quantity: number;
  sale_price: number | null;
  exchange_note: string;
  location: string;
};

export type MarketplaceItemActionContext = {
  id: string;
  title: string;
  sellerId: number;
  status: MarketplaceItem["status"];
  quantity: number;
  exchangeMode: MarketplaceItem["exchangeMode"];
  exchangeLabel: string;
  exchangeValue?: string;
  location: string;
};

const SELECT_ITEM_FIELDS = `SELECT i.id, i.title, i.description, i.exchange_note, i.condition_label, i.location,
        i.quantity, i.location_x, i.location_y, i.original_price, i.sale_price, i.status, i.category_id, i.student_id,
        c.name AS category_name, s.name AS seller_name, s.bio AS seller_bio, s.avatar_url AS seller_avatar_url, img.public_url AS image_url
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

async function mapRowsToItems(rows: ItemRow[], includeSellerRating = false) {
  const imageMap = await loadImagesByItemIds(rows.map((row) => row.id));
  const ratings = includeSellerRating
    ? await Promise.all(
        rows.map(async (row) => {
          const { findStudentRatingSummary } = await import("@/lib/marketplace/infrastructure/review-repository");
          return findStudentRatingSummary(row.student_id);
        })
      )
    : [];

  return rows.map((row, index) =>
    mapMarketplaceItem(row, imageMap.get(row.id) ?? (row.image_url ? [row.image_url] : []), {
      categoryId: String(row.category_id),
      sellerId: String(row.student_id),
      sellerBio: row.seller_bio ?? undefined,
      sellerAvatarUrl: row.seller_avatar_url ?? undefined,
      sellerRating: includeSellerRating ? ratings[index] : undefined
    })
  );
}

function buildFilterQuery(filters: MarketplaceItemFilters = {}) {
  const conditions = [`i.status = 'active'`, `s.status = 'active'`];
  const params: Array<string | number> = [];

  const keyword = filters.keyword?.trim();
  if (keyword) {
    conditions.push(`(i.title LIKE ? OR i.description LIKE ? OR i.exchange_note LIKE ?)`);
    const pattern = `%${keyword}%`;
    params.push(pattern, pattern, pattern);
  }

  const categoryId = filters.categoryId?.trim();
  if (categoryId) {
    conditions.push(`i.category_id = ?`);
    params.push(Number(categoryId));
  }

  const minPrice = filters.minPrice?.trim();
  if (minPrice) {
    conditions.push(`i.sale_price IS NOT NULL AND i.sale_price >= ?`);
    params.push(Number(minPrice));
  }

  const maxPrice = filters.maxPrice?.trim();
  if (maxPrice) {
    conditions.push(`i.sale_price IS NOT NULL AND i.sale_price <= ?`);
    params.push(Number(maxPrice));
  }

  return {
    whereClause: conditions.join(" AND "),
    params
  };
}

export async function findPublicMarketplaceItems(filters: MarketplaceItemFilters = {}) {
  const pool = getDbPool();
  const { whereClause, params } = buildFilterQuery(filters);
  const [rows] = await pool.query<ItemRow[]>(
    `${SELECT_ITEM_FIELDS}
     WHERE ${whereClause}
     ORDER BY i.created_at DESC`,
    params
  );

  return mapRowsToItems(rows);
}

export async function findMarketplaceItemById(itemId: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<ItemRow[]>(
    `${SELECT_ITEM_FIELDS}
     WHERE i.id = ? AND i.status = 'active' AND s.status = 'active'
     LIMIT 1`,
    [itemId]
  );

  const [item] = await mapRowsToItems(rows, true);
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
    `SELECT i.id, i.title, i.student_id, i.status, i.quantity, i.sale_price, i.exchange_note, i.location
     FROM items i
     JOIN students s ON s.id = i.student_id
     WHERE i.id = ? AND i.status = 'active' AND s.status = 'active'
     LIMIT 1`,
    [itemId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const acceptedCount = await countAcceptedAppointmentsForItem(row.id);
  if (acceptedCount >= Number(row.quantity)) {
    return null;
  }

  const exchange = resolveStoredExchange(null, null, row.sale_price === null ? null : Number(row.sale_price), row.exchange_note);

  return {
    id: String(row.id),
    title: row.title,
    sellerId: row.student_id,
    status: row.status,
    quantity: Number(row.quantity),
    exchangeMode: exchange.exchangeMode,
    exchangeLabel: exchange.exchangeLabel,
    exchangeValue: exchange.exchangeValue,
    location: row.location
  };
}

export async function findStudentWishlistIds(studentId: number): Promise<string[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT item_id FROM wishlists WHERE student_id = ? ORDER BY created_at DESC`,
    [studentId]
  );
  return rows.map(r => String(r.item_id));
}

export async function findStudentWishlistItems(studentId: number): Promise<MarketplaceItem[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute<ItemRow[]>(
    `${SELECT_ITEM_FIELDS}
     JOIN wishlists w ON w.item_id = i.id
     WHERE w.student_id = ? AND i.status = 'active'
     ORDER BY w.created_at DESC`,
    [studentId]
  );

  const items = await mapRowsToItems(rows);
  return items;
}
