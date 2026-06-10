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



type UpdateMarketplaceItemStatusInput = {
  itemId: number;
  studentId: number;
  nextStatus: "active" | "reserved" | "removed" | "deleted";
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
  const [result] = await connection.execute<mysql.ResultSetHeader>(
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

  return result.insertId;
}



export async function deleteMarketplaceItemImagesByIds(
  connection: mysql.PoolConnection,
  input: {
    itemId: number;
    imageIds: number[];
  }
) {
  if (input.imageIds.length === 0) {
    return;
  }

  const placeholders = input.imageIds.map(() => "?").join(", ");
  await connection.query(
    `DELETE FROM item_images
     WHERE item_id = ? AND id IN (${placeholders})`,
    [input.itemId, ...input.imageIds]
  );
}

export async function updateMarketplaceItemImageOrdering(
  connection: mysql.PoolConnection,
  input: {
    imageId: number;
    itemId: number;
    sortOrder: number;
    isPrimary: boolean;
  }
) {
  await connection.execute(
    `UPDATE item_images
     SET sort_order = ?, is_primary = ?
     WHERE id = ? AND item_id = ?`,
    [input.sortOrder, input.isPrimary ? 1 : 0, input.imageId, input.itemId]
  );
}

export async function updateMarketplaceItemStatus(
  connection: mysql.PoolConnection,
  input: UpdateMarketplaceItemStatusInput
) {
  await connection.execute(
    `UPDATE items
     SET status = ?
     WHERE id = ? AND student_id = ?`,
    [input.nextStatus, input.itemId, input.studentId]
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
