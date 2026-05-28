"use client";

import { useState } from "react";
import type { Locale } from "@/lib/content";

const text = {
  en: {
    name: "Name",
    rating: "Rating",
    message: "Review",
    photo: "Optional headshot",
    consent: "I give permission for Medina Clean to show my review and photo on the website.",
    submit: "Submit review",
    sending: "Sending...",
    success: "Review received. It will appear only after Rosa approves it.",
    error: "The review could not be sent."
  },
  es: {
    name: "Nombre",
    rating: "Calificación",
    message: "Reseña",
    photo: "Foto opcional",
    consent: "Doy permiso para que Medina Clean muestre mi reseña y foto en el sitio web.",
    submit: "Enviar reseña",
    sending: "Enviando...",
    success: "Reseña recibida. Aparecerá solo después de la aprobación de Rosa.",
    error: "No se pudo enviar la reseña."
  }
};

export function ReviewForm({ locale }: { locale: Locale }) {
  const t = text[locale];
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const source = new FormData(form);
    const formData = new FormData();
    formData.set("language", locale);
    formData.set("name", String(source.get("name") || ""));
    formData.set("rating", String(source.get("rating") || ""));
    formData.set("message", String(source.get("message") || ""));
    formData.set("consent", source.get("consent") ? "true" : "false");

    const photo = source.get("photo");
    if (photo instanceof File && photo.size > 0) {
      formData.set("photo", await resizeImage(photo));
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || t.error);
      }

      form.reset();
      setStatus({ type: "success", message: t.success });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : t.error });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        {t.name}
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        {t.rating}
        <select name="rating" required defaultValue="5">
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.message}
        <textarea name="message" required minLength={20} />
      </label>
      <label>
        {t.photo}
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      <label className="checkbox">
        <input name="consent" type="checkbox" required />
        <span>{t.consent}</span>
      </label>
      <button className="button secondary" type="submit" disabled={submitting}>
        {submitting ? t.sending : t.submit}
      </button>
      <p className={`status ${status.type === "error" ? "error" : status.type === "success" ? "success" : ""}`}>
        {status.message}
      </p>
    </form>
  );
}

async function resizeImage(file: File) {
  const image = await createImageBitmap(file);
  const size = 300;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  const scale = Math.max(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = (size - width) / 2;
  const y = (size - height) / 2;
  context.drawImage(image, x, y, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.72));
  return blob ? new File([blob], "review-headshot.webp", { type: "image/webp" }) : file;
}
