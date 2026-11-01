// src/lib/server/profileValidators.ts
import { z } from "zod";

/**
 * Validates self-service profile update requests.
 */
export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(80, "Nama maksimal 80 karakter.")
      .optional(),
    avatar: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (!val) return true;
          if (val.startsWith("data:image/")) return true;
          try {
            const url = new URL(val);
            return url.protocol === "http:" || url.protocol === "https:";
          } catch {
            return false;
          }
        },
        { message: "Format avatar harus berupa URL http(s) atau data URI gambar yang valid." },
      )
      .nullable()
      .optional(),
    currentPassword: z.string().min(1, "Password saat ini wajib diisi.").optional(),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter.").max(100).optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Password saat ini harus diisi jika ingin mengganti password baru.",
      path: ["currentPassword"],
    },
  )
  .refine(
    (data) => {
      if (
        data.newPassword &&
        data.confirmPassword &&
        data.newPassword !== data.confirmPassword
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Konfirmasi password baru tidak cocok.",
      path: ["confirmPassword"],
    },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

