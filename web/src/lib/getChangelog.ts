import { siteConfig } from "@/config/site";

interface Release {
  tag_name: string;
  body: string;
  assets: Array<{ browser_download_url: string }>;
  created_at: string;
}

interface ParsedRelease {
  version: string;
  changes: string[];
  downloadUrl: string | undefined;
  date: string;
}

async function getReleasesInfo(): Promise<Release[] | null> {
  try {
    const response = await fetch(siteConfig.githubReleasesUrl);
    if (!response.ok) {
      throw new Error("Error al obtener las versiones");
    }
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

export async function getChangelog(): Promise<ParsedRelease[] | null> {
  const releases = await getReleasesInfo();

  if (!releases) return null;

  return releases.map((release) => {
    const changes = release.body
      .split("\r\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-"))
      .map((line) => line.substring(1).trim());

    return {
      version: release.tag_name,
      changes,
      downloadUrl: release.assets.find((asset) =>
        asset.browser_download_url.endsWith(".exe")
      )?.browser_download_url,
      date: release.created_at,
    };
  });
}
