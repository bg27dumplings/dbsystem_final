import { inferExchangeFromStoredValues, resolveStoredExchange } from "@/lib/marketplace/domain/exchange";
import type { AppointmentSummary, ChatRoomDetail, ChatRoomSummary, MarketplaceItem } from "@/lib/marketplace/domain/models";

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

export function mapAppointmentSummary(row: AppointmentRowShape): AppointmentSummary {
  const exchange = resolveStoredExchange(
    row.exchange_mode,
    row.exchange_value,
    row.amount > 0 ? Number(row.amount) : null,
    row.note ?? ""
  );

  return {
    id: String(row.id),
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
