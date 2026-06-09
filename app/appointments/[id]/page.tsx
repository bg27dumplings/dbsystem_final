import { redirect } from "next/navigation";

export default async function AppointmentDetailRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/me/appointments/${id}`);
}
