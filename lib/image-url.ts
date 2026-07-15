export function normalizeImageUrl(url?: string | null) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    if (parsed.hostname === "drive.google.com") {
      const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      const id = fileMatch?.[1] || parsed.searchParams.get("id");
      if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
    }
  } catch {
    return url;
  }

  return url;
}

export function shouldSkipImageOptimization(url: string) {
  try {
    return new URL(url).hostname === "drive.google.com";
  } catch {
    return false;
  }
}
