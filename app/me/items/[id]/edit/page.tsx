import Link from "next/link";
import { items } from "@/lib/data";
import { requireStudentSession } from "@/lib/auth/guards";
import NewItemPage from "../../new/page";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStudentSession("/me/items");
  const { id } = await params;
  if (!items.some((item) => item.id === id)) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <h1 className="text-2xl font-black text-campus-ink">Item not found</h1>
        <p className="mt-3 text-slate-700">The item you want to edit is not available in the current demo data set.</p>
        <Link href="/me/items" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          Back to my items
        </Link>
      </section>
    );
  }
  return <NewItemPage />;
}
