import {
  findEditableMarketplaceItemById,
  findMarketplaceItemById,
  findMarketplaceItemsByStudentId,
  findOwnedMarketplaceItemById,
  findPublicMarketplaceItems
} from "@/lib/marketplace/infrastructure/item-repository";
import {
  findStudentAppointmentById,
  findStudentAppointmentDetailById,
  findStudentAppointments
} from "@/lib/marketplace/infrastructure/appointment-repository";
import { findStudentChatRoomById, findStudentChatRooms } from "@/lib/marketplace/infrastructure/chat-repository";
import { findActiveMarketplaceCategories } from "@/lib/marketplace/infrastructure/category-repository";

export async function findPublicItems() {
  return findPublicMarketplaceItems();
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

export async function findEditableOwnedItemById(studentId: number, itemId: string) {
  return findEditableMarketplaceItemById(studentId, itemId);
}

export async function findAppointmentsByStudentId(studentId: number) {
  return findStudentAppointments(studentId);
}

export async function findAppointmentByIdForStudent(studentId: number, appointmentId: string) {
  return findStudentAppointmentById(studentId, appointmentId);
}

export async function findAppointmentDetailByIdForStudent(studentId: number, appointmentId: string) {
  return findStudentAppointmentDetailById(studentId, appointmentId);
}

export async function findChatRoomsByStudentId(studentId: number) {
  return findStudentChatRooms(studentId);
}

export async function findChatRoomByIdForStudent(studentId: number, roomId: string) {
  return findStudentChatRoomById(studentId, roomId);
}

export async function findActiveCategories() {
  return findActiveMarketplaceCategories();
}
