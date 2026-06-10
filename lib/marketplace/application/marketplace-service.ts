import { syncAppointmentLifecycle } from "@/lib/marketplace/application/appointment-lifecycle-service";
import {
  findMarketplaceItemById,
  findMarketplaceItemsByStudentId,
  findOwnedMarketplaceItemById,
  findPublicMarketplaceItems,
  findStudentWishlistIds,
  findStudentWishlistItems
} from "@/lib/marketplace/infrastructure/item-repository";
import {
  countPendingAppointmentsForStudent,
  findStudentAppointmentById,
  findStudentAppointments,
  countUnreadAppointments as findUnreadAppointmentsCount
} from "@/lib/marketplace/infrastructure/appointment-repository";
import { findStudentChatRoomById, findStudentChatRooms, countUnreadChatMessages as findUnreadCount } from "@/lib/marketplace/infrastructure/chat-repository";
import { findActiveMarketplaceCategories } from "@/lib/marketplace/infrastructure/category-repository";
import { findPendingReviewsForStudent } from "@/lib/marketplace/infrastructure/review-repository";
import { findStudentProfile } from "@/lib/marketplace/infrastructure/student-profile-repository";

import type { MarketplaceItemFilters } from "@/lib/marketplace/domain/models";

export async function findPublicItems(filters: MarketplaceItemFilters = {}) {
  return findPublicMarketplaceItems(filters);
}

export async function findItemById(itemId: string) {
  return findMarketplaceItemById(itemId);
}

export async function findItemsByStudentId(studentId: number) {
  return findMarketplaceItemsByStudentId(studentId);
}

export async function findOwnedItemById(studentId: number, itemId: string) {
  return findOwnedMarketplaceItemById(studentId, itemId);
}

export async function findStudentWishlist(studentId: number) {
  return findStudentWishlistIds(studentId);
}

export async function findStudentWishlistItemsService(studentId: number) {
  return findStudentWishlistItems(studentId);
}



export async function findAppointmentsByStudentId(studentId: number) {
  await syncAppointmentLifecycle();
  return findStudentAppointments(studentId);
}

export async function findAppointmentByIdForStudent(studentId: number, appointmentId: string) {
  await syncAppointmentLifecycle();
  return findStudentAppointmentById(studentId, appointmentId);
}



export async function findPendingReviews(studentId: number) {
  await syncAppointmentLifecycle();
  return findPendingReviewsForStudent(studentId);
}

export async function findPendingAppointmentCount(studentId: number) {
  return countPendingAppointmentsForStudent(studentId);
}

export async function countUnreadAppointments(studentId: number) {
  return findUnreadAppointmentsCount(studentId);
}

export async function findStudentProfileById(studentId: number) {
  return findStudentProfile(studentId);
}

export async function findChatRoomsByStudentId(studentId: number) {
  return findStudentChatRooms(studentId);
}

export async function findChatRoomByIdForStudent(studentId: number, roomId: string) {
  return findStudentChatRoomById(studentId, roomId);
}

export async function countUnreadChatMessages(studentId: number) {
  return findUnreadCount(studentId);
}

export async function findActiveCategories() {
  return findActiveMarketplaceCategories();
}
