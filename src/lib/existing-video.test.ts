import { describe, expect, it } from "vitest";
import { buildExistingVideoRow } from "./existing-video";

describe("buildExistingVideoRow", () => {
  it("builds a visible site_videos row from a Shorts URL with EN + ES titles", () => {
    const result = buildExistingVideoRow({
      url: "https://youtube.com/shorts/bF2KS3gXMeM",
      titleEn: "Recent project",
      titleEs: "Proyecto reciente"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row).toMatchObject({
      title_en: "Recent project",
      title_es: "Proyecto reciente",
      youtube_video_id: "bF2KS3gXMeM",
      youtube_url: "https://youtube.com/shorts/bF2KS3gXMeM",
      embed_url: "https://www.youtube-nocookie.com/embed/bF2KS3gXMeM",
      privacy_status: "public",
      is_visible: true
    });
  });

  it("accepts a standard watch URL", () => {
    const result = buildExistingVideoRow({ url: "https://www.youtube.com/watch?v=bF2KS3gXMeM", titleEn: "A", titleEs: "B" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.youtube_url).toBe("https://www.youtube.com/watch?v=bF2KS3gXMeM");
    expect(result.row.youtube_video_id).toBe("bF2KS3gXMeM");
  });

  it("fills both titles when only one language is provided", () => {
    const result = buildExistingVideoRow({ url: "https://youtu.be/bF2KS3gXMeM", titleEs: "Solo español" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.title_en).toBe("Solo español");
    expect(result.row.title_es).toBe("Solo español");
  });

  it("rejects an invalid/blank YouTube URL", () => {
    expect(buildExistingVideoRow({ url: "https://example.com/x", titleEn: "A" }).ok).toBe(false);
    expect(buildExistingVideoRow({ url: "", titleEn: "A" }).ok).toBe(false);
  });

  it("rejects when no title is provided", () => {
    expect(buildExistingVideoRow({ url: "https://youtu.be/bF2KS3gXMeM" }).ok).toBe(false);
  });

  it("defaults an invalid privacy status to public", () => {
    const result = buildExistingVideoRow({ url: "https://youtu.be/bF2KS3gXMeM", titleEn: "A", privacyStatus: "bogus" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.privacy_status).toBe("public");
  });
});
