export type ItemStatus = "active" | "reserved" | "removed" | "violation_removed" | "deleted";
export type AppointmentStatus = "pending" | "accepted" | "completed" | "failed" | "cancelled" | "rejected";

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
  amount: number;
  status: AppointmentStatus;
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
