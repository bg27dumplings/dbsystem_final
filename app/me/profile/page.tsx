import { MeSubnav } from "@/components/me/me-subnav";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireStudentSession } from "@/lib/auth/guards";
import { findStudentProfileById } from "@/lib/marketplace/queries";

export default async function MyProfilePage() {
  const session = await requireStudentSession("/me/profile");
  const profile = await findStudentProfileById(session.studentId);

  if (!profile) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <h1 className="text-2xl font-black text-campus-ink">找不到個人資料</h1>
      </section>
    );
  }

  return (
    <section aria-labelledby="profile-heading" className="space-y-4">
      <div>
        <p className="text-sm font-black text-campus-moss">我的</p>
        <h1 id="profile-heading" className="text-3xl font-black text-campus-ink">個人資料</h1>
        <p className="mt-2 text-slate-700">編輯簡介與查看你的累積評價。</p>
      </div>
      <MeSubnav active="profile" />
      <ProfileForm profile={profile} />
    </section>
  );
}
