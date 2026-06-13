export type ItemStatus = "active" | "hidden" | "reserved" | "removed" | "completed" | "violation_removed" | "deleted" | "ai_blocked" | "pending_review";

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
  sellerId: string;
  sellerBio?: string;
  sellerAvatarUrl?: string;
  sellerRating?: StudentRatingSummary;
  status: ItemStatus;
  removedReason?: string;
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
  buyerAvatarUrl?: string;
  seller: string;
  sellerId: string;
  sellerAvatarUrl?: string;
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
  imageUrl?: string;
  hasUnreadUpdates: boolean;
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
  avatarUrl: string | null;
  rating: StudentRatingSummary;
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
  counterpartAvatarUrl?: string;
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
  counterpartAvatarUrl?: string;
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
