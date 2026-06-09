import "server-only";
import type mysql from "mysql2/promise";

type CreateMarketplaceItemRecordInput = {
  studentId: number;
  categoryId: number;
  title: string;
  description: string;
  exchangeNote: string;
  conditionLabel: string;
  location: string;
  quantity: number;
  locationX: number | null;
  locationY: number | null;
  originalPrice: number;
  salePrice: number | null;
};

type CreateMarketplaceItemImageRecordInput = {
  itemId: number;
  storagePath: string;
  publicUrl: string;
  altText: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  isPrimary: boolean;
};

export async function insertMarketplaceItem(
  connection: mysql.PoolConnection,
  input: CreateMarketplaceItemRecordInput
) {
  const [result] = await connection.execute<mysql.ResultSetHeader>(
    `INSERT INTO items (
      student_id,
      category_id,
      title,
      description,
      exchange_note,
      condition_label,
      location,
      quantity,
      location_x,
      location_y,
      original_price,
      sale_price,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      input.studentId,
      input.categoryId,
      input.title,
      input.description,
      input.exchangeNote,
      input.conditionLabel,
      input.location,
      input.quantity,
      input.locationX,
      input.locationY,
      input.originalPrice,
      input.salePrice
    ]
  );

  return result.insertId;
}

export async function insertMarketplaceItemImage(
  connection: mysql.PoolConnection,
  input: CreateMarketplaceItemImageRecordInput
) {
  await connection.execute(
    `INSERT INTO item_images (
      item_id,
      storage_path,
      public_url,
      alt_text,
      mime_type,
      file_size,
      sort_order,
      is_primary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.itemId,
      input.storagePath,
      input.publicUrl,
      input.altText,
      input.mimeType,
      input.fileSize,
      input.sortOrder,
      input.isPrimary ? 1 : 0
    ]
  );
}

type UpdateMarketplaceItemRecordInput = {
  itemId: number;
  categoryId: number;
  title: string;
  description: string;
  exchangeNote: string;
  conditionLabel: string;
  location: string;
  quantity: number;
  locationX: number | null;
  locationY: number | null;
  originalPrice: number;
  salePrice: number | null;
};

export async function updateMarketplaceItemRecord(
  connection: mysql.PoolConnection,
  input: UpdateMarketplaceItemRecordInput
) {
  await connection.execute(
    `UPDATE items
     SET category_id = ?,
         title = ?,
         description = ?,
         exchange_note = ?,
         condition_label = ?,
         location = ?,
         quantity = ?,
         location_x = ?,
         location_y = ?,
         original_price = ?,
         sale_price = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      input.categoryId,
      input.title,
      input.description,
      input.exchangeNote,
      input.conditionLabel,
      input.location,
      input.quantity,
      input.locationX,
      input.locationY,
      input.originalPrice,
      input.salePrice,
      input.itemId
    ]
  );
}

export async function deleteMarketplaceItemImages(connection: mysql.PoolConnection, itemId: number) {
  await connection.execute(`DELETE FROM item_images WHERE item_id = ?`, [itemId]);
}
