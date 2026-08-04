import { describe, expect, it } from "vitest";
import { projectVideos } from "./content";
import { findVideoRefProblems, parseYouTubeId } from "./video-links";

describe("parseYouTubeId", () => {
  it("extracts ids from shorts, embed, watch, and youtu.be URLs", () => {
    expect(parseYouTubeId("https://youtube.com/shorts/bF2KS3gXMeM")).toBe("bF2KS3gXMeM");
    expect(parseYouTubeId("https://www.youtube-nocookie.com/embed/bF2KS3gXMeM")).toBe("bF2KS3gXMeM");
    expect(parseYouTubeId("https://youtube.com/watch?v=bF2KS3gXMeM")).toBe("bF2KS3gXMeM");
    expect(parseYouTubeId("https://youtu.be/bF2KS3gXMeM")).toBe("bF2KS3gXMeM");
    expect(parseYouTubeId("https://example.com/not-a-video")).toBeNull();
  });
});

describe("findVideoRefProblems", () => {
  it("flags an id/url mismatch and a malformed id", () => {
    expect(
      findVideoRefProblems([
        { id: "bF2KS3gXMeM", watchUrl: "https://youtube.com/shorts/DQs4E0SqXc8", embedUrl: "https://www.youtube-nocookie.com/embed/bF2KS3gXMeM" }
      ]).length
    ).toBeGreaterThan(0);
    expect(findVideoRefProblems([{ id: "bad", watchUrl: "x", embedUrl: "y" }]).length).toBeGreaterThan(0);
  });

  it("every fallback project video is well-formed and includes the new video", () => {
    expect(findVideoRefProblems(projectVideos)).toEqual([]);
    expect(projectVideos.some((v) => v.id === "bF2KS3gXMeM")).toBe(true);
  });
});
