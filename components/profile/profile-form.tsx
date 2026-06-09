"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/reviews/star-rating";
import type { StudentProfile } from "@/lib/marketplace/domain/models";

export function ProfileForm({ profile }: { profile: StudentProfile }) {
  const router = useRouter();
  const [bio, setBio] = useState(profile.bio);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ bio?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFieldErrors({});
    setSaved(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio })
      });

      const result = (await response.json()) as {
        ok: boolean;
        formError?: string;
        fieldErrors?: { bio?: string };
      };

      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "資料更新失敗，請稍後再試。");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setFormError("系統忙碌中，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10" onSubmit={handleSubmit}>
      <dl className="grid gap-3 rounded-lg bg-campus-paper p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-black">姓名</dt>
          <dd>{profile.name}</dd>
        </div>
        <div>
          <dt className="font-black">學號</dt>
          <dd>{profile.studentNo}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-black">信箱</dt>
          <dd>{profile.email}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-black">累積評價</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2">
            <StarRating value={profile.rating.averageRating} readonly />
            <span className="text-sm text-slate-700">（{profile.rating.reviewCount} 則評價）</span>
          </dd>
        </div>
      </dl>
      <div>
        <label htmlFor="bio" className="font-bold">
          個人簡介
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={4}
          placeholder="簡單介紹自己，讓買賣雙方更放心交易。"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
        />
        {fieldErrors.bio ? <p className="mt-1 text-sm font-semibold text-campus-red">{fieldErrors.bio}</p> : null}
      </div>
      {formError ? <p className="text-sm font-semibold text-campus-red" role="alert">{formError}</p> : null}
      {saved ? <p className="text-sm font-semibold text-emerald-700" role="status">個人資料已更新。</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "儲存中..." : "儲存個人資料"}
      </button>
    </form>
  );
}
