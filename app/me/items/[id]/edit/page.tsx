import { notFound } from "next/navigation";
import { items } from "@/lib/data";
import NewItemPage from "../../new/page";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!items.some((item) => item.id === id)) notFound();
  return <NewItemPage />;
}
