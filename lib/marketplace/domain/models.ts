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
  sellerId: string;
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
  itemId: string;
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

export type AppointmentReviewRecord = {
  id: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
};

export type AppointmentDetail = AppointmentSummary & {
  itemStatus: ItemStatus;
  buyerId: string;
  sellerId: string;
  isBuyer: boolean;
  isSeller: boolean;
  reviews: AppointmentReviewRecord[];
  canAccept: boolean;
  canReject: boolean;
  canCancel: boolean;
  canComplete: boolean;
  canFail: boolean;
  canReview: boolean;
  hasReviewed: boolean;
};

export type ChatRoomSummary = {
  id: string;
  itemTitle: string;
  counterpartName: string;
  lastMessage: string;
  isSeller: boolean;
  unreadCount: number;
};

export type ChatMessageRecord = {
  id: string;
  body: string;
  time: string;
  isMine: boolean;
  messageType: string;
  isEdited?: boolean;
};

export type ChatRoomDetail = {
  roomId: string;
  itemTitle: string;
  counterpartName: string;
  messages: ChatMessageRecord[];
};

export type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
};

export type EditableMarketplaceImage = {
  id: string;
  publicUrl: string;
  altText: string;
};

export type EditableMarketplaceItem = {
  id: string;
  title: string;
  categoryId: string;
  conditionLabel: string;
  location: string;
  status: ItemStatus;
  exchangeMode: MarketplaceExchangeMode;
  exchangeLabel: string;
  exchangeValue?: string;
  description: string;
  images: EditableMarketplaceImage[];
};
