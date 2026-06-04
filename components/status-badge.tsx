import type { AppointmentStatus, ItemStatus } from "@/lib/data";

const labels: Record<ItemStatus | AppointmentStatus, string> = {
  active: "上架中",
  reserved: "預約中",
  removed: "已下架",
  violation_removed: "違規下架",
  deleted: "已刪除",
  pending: "等待同意",
  accepted: "已同意",
  completed: "已完成",
  failed: "交易失敗",
  cancelled: "已取消",
  rejected: "已拒絕"
};

const styles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-950 ring-emerald-300",
  reserved: "bg-amber-100 text-amber-950 ring-amber-300",
  removed: "bg-slate-200 text-slate-900 ring-slate-300",
  violation_removed: "bg-red-100 text-red-950 ring-red-300",
  deleted: "bg-slate-200 text-slate-900 ring-slate-300",
  pending: "bg-blue-100 text-blue-950 ring-blue-300",
  accepted: "bg-emerald-100 text-emerald-950 ring-emerald-300",
  completed: "bg-campus-moss text-white ring-campus-moss",
  failed: "bg-red-100 text-red-950 ring-red-300",
  cancelled: "bg-slate-200 text-slate-900 ring-slate-300",
  rejected: "bg-red-100 text-red-950 ring-red-300"
};

export function StatusBadge({ status }: { status: ItemStatus | AppointmentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status]}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
