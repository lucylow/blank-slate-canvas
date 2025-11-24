export async function loadTrackSummary(trackId: string) {
  // first try to fetch from server path (if you serve /mnt/data via dev server),
  // otherwise, fallback to fetch from local public/ai_summary_reports/<track>_mock.json
  const candidates = [
    `/api/ai-summaries/${trackId}/html`, // if you have server
    `/ai_summary_reports/${trackId}_mock.json`,
    `/mnt/data/ai_summary_reports/${trackId}_mock.json`
  ];
  for (const url of candidates) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const json = await resp.json();
      return json;
    } catch (e) {
      continue;
    }
  }
  return null;
}

