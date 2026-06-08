export type ItemStatus = "active" | "reserved" | "removed" | "violation_removed" | "deleted";
export type AppointmentStatus = "pending" | "accepted" | "completed" | "failed" | "cancelled" | "rejected";
export type MarketplaceExchangeMode = "price" | "treat_drink" | "treat_food" | "free" | "custom";

export type MarketplaceItem = {
  id: string;
  title: string;
  category: string;
  condition: string;
  location: string;
  seller: string;
  status: ItemStatus;
  originalPrice: number;
  salePrice?: number;
  exchangeMode: MarketplaceExchangeMode;
  exchangeLabel: string;
  exchangeValue?: string;
  exchangeNote: string;
  description: string;
  images: string[];
};

export type AppointmentSummary = {
  id: string;
  itemTitle: string;
  buyer: string;
  seller: string;
  time: string;
  location: string;
  status: AppointmentStatus;
  exchangeMode: MarketplaceExchangeMode;
  exchangeLabel: string;
  exchangeValue?: string;
  note?: string;
};

export type ChatRoomSummary = {
  id: string;
  itemTitle: string;
  counterpartName: string;
  lastMessage: string;
};

export type ChatMessageRecord = {
  id: string;
  body: string;
  time: string;
  isMine: boolean;
  messageType: string;
};

export type ChatRoomDetail = {
  roomId: string;
  itemTitle: string;
  messages: ChatMessageRecord[];
};

export type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
};
