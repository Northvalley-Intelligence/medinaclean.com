// GEN-002 TASK-023 — static video link check. Catches malformed or inconsistent video references in
// the site's fallback list before deploy (RISK-015 / RISK-003). Runtime availability (a video pulled
// from YouTube) is handled separately by isYouTubeVideoAvailable, which auto-hides dead public videos.

export type VideoRef = {
  id: string;
  watchUrl: string;
  embedUrl: string;
};

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

// Extracts the 11-char YouTube id from shorts/watch/youtu.be/embed URLs.
export function parseYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Returns a list of problems (empty = all references are well-formed and internally consistent).
export function findVideoRefProblems(videos: VideoRef[]): string[] {
  const problems: string[] = [];
  for (const video of videos) {
    if (!YT_ID.test(video.id)) {
      problems.push(`Invalid YouTube id: "${video.id}"`);
    }
    const watchId = parseYouTubeId(video.watchUrl);
    const embedId = parseYouTubeId(video.embedUrl);
    if (watchId !== video.id) {
      problems.push(`watchUrl id (${watchId ?? "none"}) does not match id ${video.id}`);
    }
    if (embedId !== video.id) {
      problems.push(`embedUrl id (${embedId ?? "none"}) does not match id ${video.id}`);
    }
  }
  return problems;
}
