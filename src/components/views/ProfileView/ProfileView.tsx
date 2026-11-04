"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Save } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileAvatarUploader } from "./ProfileAvatarUploader";
import { ProfileAccessCard } from "./ProfileAccessCard";
import { ProfileSecurityCard } from "./ProfileSecurityCard";
import type { UserProfileResponse } from "@/types";

export function ProfileView() {
  const { data: session } = useSession();
  const syncSessionUser = useWorkspaceStore((s) => s.syncSessionUser);
  const branches = useMarcomDataStore((s) => s.branches);
  const fetchBranches = useMarcomDataStore((s) => s.fetchBranches);

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAvatar, setFormAvatar] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Gagal memuat data profil.");
      const data: UserProfileResponse = await res.json();
      setProfile(data);
      setFormName(data.name);
      setFormAvatar(data.avatar);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat profil.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
    if (branches.length === 0) {
      fetchBranches();
    }
  }, [fetchProfileData, branches.length, fetchBranches]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Nama tampilan tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          avatar: formAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui profil.");
      }

      setProfile(data);
      if (session?.user?.id) {
        syncSessionUser({
          id: session.user.id,
          name: data.name,
          avatar: data.avatar ?? undefined,
        });
      }

      toast.success("Informasi profil berhasil diperbarui!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui kata sandi.");
      }

      toast.success("Kata sandi akun Anda berhasil diperbarui!");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah password.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto">
      <ProfileHeader
        isGoogleAccount={profile?.isGoogleAccount}
        isLoading={isLoading}
        onRefresh={fetchProfileData}
      />

      <div className="p-4 sm:p-6 flex-1 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
          {/* Left Column: Personal Identity & Roles */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Informasi Personal
                </h2>
              </div>

              <ProfileAvatarUploader
                currentAvatar={formAvatar}
                userName={formName || profile?.name || "User"}
                onChangeAvatar={setFormAvatar}
                disabled={isSaving || isLoading}
              />

              <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    disabled={isSaving || isLoading}
                    placeholder="Masukkan nama lengkap Anda..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Email (Akun Resmi)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profile?.email || ""}
                      readOnly
                      disabled
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Alamat email terikat pada identitas akun dan hanya dapat dimodifikasi oleh Super Admin.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving || isLoading || !formName.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Menyimpan..." : "Simpan Informasi Pribadi"}</span>
                  </button>
                </div>
              </form>
            </div>

            <ProfileAccessCard
              role={profile?.role}
              createdAt={profile?.createdAt}
              assignedBranchIds={profile?.assignedBranchIds}
              branches={branches}
            />
          </div>

          {/* Right Column: Security & Authentication */}
          <div className="lg:col-span-5 space-y-6">
            <ProfileSecurityCard
              isGoogleAccount={profile?.isGoogleAccount}
              onUpdatePassword={handleUpdatePassword}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
