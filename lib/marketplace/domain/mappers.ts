import { inferExchangeFromStoredValues, resolveStoredExchange } from "@/lib/marketplace/domain/exchange";
import type {
  AppointmentDetail,
  AppointmentReviewRecord,
  AppointmentSummary,
  ChatRoomDetail,
  ChatRoomSummary,
  EditableMarketplaceItem,
  MarketplaceItem
} from "@/lib/marketplace/domain/models";

type ItemRowShape = {
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

type AppointmentRowShape = {
  id: number;
  item_id: number;
  item_status: MarketplaceItem["status"];
  meetup_at: Date | string;
  location: string;
  amount: number;
  exchange_mode: string | null;
  exchange_value: string | null;
  note: string | null;
  status: AppointmentSummary["status"];
  item_title: string;
  buyer_name: string;
  seller_name: string;
  buyer_id: number;
  seller_id: number;
};

type ChatRoomRowShape = {
  id: number;
  item_title: string;
  counterpart_name: string;
  last_message: string | null;
};

type ChatMessageRowShape = {
  id: number;
  body: string;
  created_at: Date | string;
  sender_id: number | null;
  message_type: string;
};

type EditableItemRowShape = {
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

type EditableItemImageRowShape = {
  id: number;
  public_url: string;
  alt_text: string;
};

type AppointmentReviewRowShape = {
  id: number;
  reviewer_id: number;
  reviewer_name: string;
  reviewee_id: number;
  reviewee_name: string;
  rating: number;
  comment: string;
  status: string;
  created_at: Date | string;
};

export function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const formatter = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return formatter.format(date).replace(/\//g, "-");
}

export function mapMarketplaceItem(row: ItemRowShape, images: string[] = []): MarketplaceItem {
  const exchange = inferExchangeFromStoredValues(row.sale_price, row.exchange_note);

  return {
    id: String(row.id),
    title: row.title,
    category: row.category_name,
    condition: row.condition_label,
    location: row.location,
    seller: row.seller_name,
    status: row.status,
    originalPrice: Number(row.original_price),
    salePrice: row.sale_price === null ? undefined : Number(row.sale_price),
    exchangeMode: exchange.exchangeMode,
    exchangeLabel: exchange.exchangeLabel,
    exchangeValue: exchange.exchangeValue,
    exchangeNote: row.exchange_note,
    description: row.description,
    images
  };
}

export function mapEditableMarketplaceItem(
  row: EditableItemRowShape,
  images: EditableItemImageRowShape[]
): EditableMarketplaceItem {
  const exchange = inferExchangeFromStoredValues(row.sale_price, row.exchange_note);

  return {
    id: String(row.id),
    title: row.title,
    categoryId: String(row.category_id),
    conditionLabel: row.condition_label,
    location: row.location,
    status: row.status,
    exchangeMode: exchange.exchangeMode,
    exchangeLabel: exchange.exchangeLabel,
    exchangeValue: exchange.exchangeValue,
    description: row.description,
    images: images.map((image) => ({
      id: String(image.id),
      publicUrl: image.public_url,
      altText: image.alt_text
    }))
  };
}

export function mapAppointmentSummary(row: AppointmentRowShape): AppointmentSummary {
  const exchange = resolveStoredExchange(
    row.exchange_mode,
    row.exchange_value,
    row.amount > 0 ? Number(row.amount) : null,
    row.note ?? ""
  );

  return {
    id: String(row.id),
    itemId: String(row.item_id),
    itemTitle: row.item_title,
    buyer: row.buyer_name,
    seller: row.seller_name,
    time: formatDateTime(row.meetup_at),
    location: row.location,
    status: row.status,
    exchangeMode: exchange.exchangeMode,
    exchangeLabel: exchange.exchangeLabel,
    exchangeValue: exchange.exchangeValue,
    note: row.note ?? undefined
  };
}

export function mapAppointmentReview(row: AppointmentReviewRowShape): AppointmentReviewRecord {
  return {
    id: String(row.id),
    reviewerId: String(row.reviewer_id),
    reviewerName: row.reviewer_name,
    revieweeId: String(row.reviewee_id),
    revieweeName: row.reviewee_name,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: formatDateTime(row.created_at)
  };
}

export function mapAppointmentDetail(
  row: AppointmentRowShape,
  studentId: number,
  reviews: AppointmentReviewRecord[]
): AppointmentDetail {
  const summary = mapAppointmentSummary(row);
  const isBuyer = row.buyer_id === studentId;
  const isSeller = row.seller_id === studentId;
  const hasReviewed = reviews.some((review) => review.reviewerId === String(studentId));
  const canReview = summary.status === "completed" && !hasReviewed;

  return {
    ...summary,
    itemStatus: row.item_status,
    buyerId: String(row.buyer_id),
    sellerId: String(row.seller_id),
    isBuyer,
    isSeller,
    reviews,
    canAccept: isSeller && summary.status === "pending",
    canReject: isSeller && summary.status === "pending",
    canCancel: isBuyer && (summary.status === "pending" || summary.status === "accepted"),
    canComplete: (isBuyer || isSeller) && summary.status === "accepted",
    canFail: (isBuyer || isSeller) && summary.status === "accepted",
    canReview,
    hasReviewed
  };
}

export function mapChatRoomSummary(row: ChatRoomRowShape): ChatRoomSummary {
  return {
    id: String(row.id),
    itemTitle: row.item_title,
    counterpartName: row.counterpart_name,
    lastMessage: row.last_message?.trim() || "目前尚無訊息。"
  };
}

export function mapChatRoomDetail(
  roomId: number,
  itemTitle: string,
  studentId: number,
  messages: ChatMessageRowShape[]
): ChatRoomDetail {
  return {
    roomId: String(roomId),
    itemTitle,
    messages: messages.map((row) => ({
      id: String(row.id),
      body: row.body,
      time: formatDateTime(row.created_at),
      isMine: row.sender_id === studentId,
      messageType: row.message_type
    }))
  };
}
