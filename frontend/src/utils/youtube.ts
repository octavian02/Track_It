export function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}