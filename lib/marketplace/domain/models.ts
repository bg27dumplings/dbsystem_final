export type ItemStatus = "active" | "hidden" | "reserved" | "removed" | "violation_removed" | "deleted";

export type MapCoordinate = {
  x: number;
  y: number;
};

export type MarketplaceItemFilters = {
  keyword?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
};
export type AppointmentStatus = "pending" | "accepted" | "completed" | "failed" | "cancelled" | "rejected";
export type MarketplaceExchangeMode = "price" | "treat_drink" | "treat_food" | "free" | "custom";

export type StudentRatingSummary = {
  averageRating: number;
  reviewCount: number;
};

export type MarketplaceItem = {
  id: string;
  title: string;
  category: string;
  categoryId?: string;
  condition: string;
  location: string;
  quantity: number;
  mapPoint?: MapCoordinate;
  seller: string;
  sellerId?: string;
  sellerBio?: string;
  sellerRating?: StudentRatingSummary;
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
  buyerId: string;
  seller: string;
  sellerId: string;
  time: string;
  meetupAt: string;
  location: string;
  mapPoint?: MapCoordinate;
  status: AppointmentStatus;
  exchangeMode: MarketplaceExchangeMode;
  exchangeLabel: string;
  exchangeValue?: string;
  note?: string;
  viewerRole: "buyer" | "seller";
};

export type PendingReview = {
  appointmentId: string;
  itemTitle: string;
  counterpartName: string;
  completedAt: string;
};

export type StudentProfile = {
  name: string;
  studentNo: string;
  email: string;
  bio: string;
  rating: StudentRatingSummary;
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
