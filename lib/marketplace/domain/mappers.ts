import { inferExchangeFromStoredValues, resolveStoredExchange } from "@/lib/marketplace/domain/exchange";
import type { AppointmentSummary, ChatRoomDetail, ChatRoomSummary, MarketplaceItem } from "@/lib/marketplace/domain/models";

type ItemRowShape = {
  id: number;
  title: string;
  description: string;
  exchange_note: string;
  condition_label: string;
  location: string;
  quantity?: number;
  location_x?: number | null;
  location_y?: number | null;
  original_price: number;
  sale_price: number | null;
  status: MarketplaceItem["status"];
  category_name: string;
  seller_name: string;
  image_url: string | null;
};

type MarketplaceItemExtras = {
  categoryId?: string;
  sellerId?: string;
  sellerBio?: string;
  sellerAvatarUrl?: string;
  sellerRating?: MarketplaceItem["sellerRating"];
};

type AppointmentRowShape = {
  id: number;
  item_id: number;
  buyer_id: number;
  seller_id: number;
  meetup_at: Date | string;
  location: string;
  location_x?: number | null;
  location_y?: number | null;
  amount: number;
  exchange_mode: string | null;
  exchange_value: string | null;
  note: string | null;
  status: AppointmentSummary["status"];
  item_title: string;
  buyer_name: string;
  buyer_avatar_url?: string | null;
  seller_name: string;
  seller_avatar_url?: string | null;
  image_url?: string | null;
  buyer_unread?: number;
  seller_unread?: number;
};

type ChatRoomRowShape = {
  id: number;
  item_title: string;
  counterpart_name: string;
  counterpart_avatar_url?: string | null;
  last_message: string | null;
  is_seller: number | boolean;
  unread_count: number;
};

type ChatMessageRowShape = {
  id: number;
  body: string;
  created_at: Date | string;
  sender_id: number | null;
  message_type: string;
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

export function toMapCoordinate(x: number | null | undefined, y: number | null | undefined) {
  if (x === null || x === undefined || y === null || y === undefined) {
    return undefined;
  }

  return { x: Number(x), y: Number(y) };
}

export function mapMarketplaceItem(row: ItemRowShape, images: string[] = [], extras: MarketplaceItemExtras = {}): MarketplaceItem {
  const exchange = inferExchangeFromStoredValues(row.sale_price, row.exchange_note);

  return {
    id: String(row.id),
    title: row.title,
    category: row.category_name,
    categoryId: extras.categoryId,
    condition: row.condition_label,
    location: row.location,
    quantity: Number(row.quantity ?? 1),
    mapPoint: toMapCoordinate(row.location_x, row.location_y),
    seller: row.seller_name,
    sellerId: extras.sellerId ?? "0",
    sellerBio: extras.sellerBio,
    sellerAvatarUrl: extras.sellerAvatarUrl,
    sellerRating: extras.sellerRating,
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

export function mapAppointmentSummary(row: AppointmentRowShape, viewerStudentId?: number): AppointmentSummary {
  const exchange = resolveStoredExchange(
    row.exchange_mode,
    row.exchange_value,
    row.amount > 0 ? Number(row.amount) : null,
    row.note ?? ""
  );

  const meetupDate = row.meetup_at instanceof Date ? row.meetup_at : new Date(row.meetup_at);

  return {
    id: String(row.id),
    itemId: String(row.item_id),
    itemTitle: row.item_title,
    buyer: row.buyer_name,
    buyerId: String(row.buyer_id),
    buyerAvatarUrl: row.buyer_avatar_url ?? undefined,
    seller: row.seller_name,
    sellerId: String(row.seller_id),
    sellerAvatarUrl: row.seller_avatar_url ?? undefined,
    time: formatDateTime(row.meetup_at),
    meetupAt: Number.isNaN(meetupDate.getTime()) ? String(row.meetup_at) : meetupDate.toISOString(),
    location: row.location,
    mapPoint: toMapCoordinate(row.location_x, row.location_y),
    status: row.status,
    exchangeMode: exchange.exchangeMode,
    exchangeLabel: exchange.exchangeLabel,
    exchangeValue: exchange.exchangeValue,
    note: row.note ?? undefined,
    viewerRole: viewerStudentId === row.seller_id ? "seller" : "buyer",
    imageUrl: row.image_url ?? undefined,
    hasUnreadUpdates: viewerStudentId === row.seller_id ? row.seller_unread === 1 : row.buyer_unread === 1
  };
}

export function mapChatRoomSummary(row: ChatRoomRowShape): ChatRoomSummary {
  return {
    id: String(row.id),
    itemTitle: row.item_title,
    counterpartName: row.counterpart_name,
    counterpartAvatarUrl: row.counterpart_avatar_url ?? undefined,
    lastMessage: row.last_message?.trim() || "尚無訊息",
    isSeller: Boolean(row.is_seller),
    unreadCount: Number(row.unread_count)
  };
}

export function mapChatRoomDetail(
  roomId: number,
  itemTitle: string,
  counterpartName: string,
  counterpartAvatarUrl: string | null | undefined,
  studentId: number,
  messages: ChatMessageRowShape[]
): ChatRoomDetail {
  return {
    roomId: String(roomId),
    itemTitle,
    counterpartName,
    counterpartAvatarUrl: counterpartAvatarUrl ?? undefined,
    messages: messages.map((row) => ({
      id: String(row.id),
      body: row.body,
      time: formatDateTime(row.created_at),
      isMine: row.sender_id === studentId,
      messageType: row.message_type
    }))
  };
}
