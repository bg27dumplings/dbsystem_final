"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/reviews/star-rating";
import { User, Upload, X } from "lucide-react";
import type { StudentProfile } from "@/lib/marketplace/domain/models";
import { ImageCropperDialog } from "./image-cropper-dialog";

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Bella",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Daisy",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Ethan",
];

export function ProfileForm({ profile }: { profile: StudentProfile }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ bio?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setFormError("只接受圖片檔案格式。");
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setCropImageUrl(objectUrl);
      setFormError("");
    }
  }

  function selectPreset(url: string) {
    setAvatarFile(null);
    setAvatarUrl(url);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFieldErrors({});
    setSaved(false);

    try {
      const formData = new FormData();
      formData.append("bio", bio);
      if (avatarUrl && !avatarFile) {
        formData.append("avatarUrl", avatarUrl);
      }
      if (avatarFile) {
        formData.append("avatarFile", avatarFile);
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        body: formData,
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
    <>
      {cropImageUrl && (
        <ImageCropperDialog
          imageUrl={cropImageUrl}
          onClose={() => {
            setCropImageUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          onCropComplete={(croppedFile, croppedUrl) => {
            setAvatarFile(croppedFile);
            setAvatarUrl(croppedUrl);
            setCropImageUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      )}
      <form className="space-y-6 rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10" onSubmit={handleSubmit}>
      
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-md bg-campus-ink/5 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="個人頭像" className="h-full w-full object-cover" />
            ) : (
              <User size={40} className="text-campus-ink" />
            )}
            {avatarUrl && (
              <button
                type="button"
                onClick={() => {
                  setAvatarUrl(null);
                  setAvatarFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                aria-label="移除頭像"
              >
                <X size={12} />
              </button>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 rounded-full border border-campus-ink/20 px-3 py-1 text-xs font-bold text-campus-ink hover:bg-campus-ink/5"
          >
            <Upload size={14} />
            上傳照片
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-sm font-bold text-slate-700 text-center sm:text-left">或選擇預設頭像</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            {PRESET_AVATARS.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => selectPreset(url)}
                className={`h-12 w-12 overflow-hidden rounded-full border-2 transition-all hover:scale-110 ${
                  avatarUrl === url ? "border-campus-moss ring-2 ring-campus-moss/50" : "border-transparent bg-campus-ink/5"
                }`}
              >
                <img src={url} alt="預設頭像" className="h-full w-full" />
              </button>
            ))}
          </div>
        </div>
      </div>

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
          placeholder="簡單介紹自己，讓買賣雙方能放心交易。"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3 focus:border-campus-moss focus:ring-1 focus:ring-campus-moss"
        />
        {fieldErrors.bio ? <p className="mt-1 text-sm font-semibold text-campus-red">{fieldErrors.bio}</p> : null}
      </div>
      {formError ? <p className="text-sm font-semibold text-campus-red" role="alert">{formError}</p> : null}
      {saved ? <p className="text-sm font-semibold text-emerald-700" role="status">個人資料已更新！</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto rounded-md bg-campus-moss px-8 py-3 font-black text-white hover:bg-campus-ink disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "儲存中..." : "儲存個人資料"}
      </button>
    </form>
    </>
  );
}
