import { siteConfig } from "@/config/site";

export interface GithubRelease {
  tag_name: string;
  body: string;
  created_at: string;
  assets: Array<{ browser_download_url: string }>;
}

export interface ParsedRelease {
  version: string;
  changes: string[];
  downloadUrl: string | undefined;
  date: string;
}

export async function getReleasesInfo() {
  try {
    const response = await fetch(siteConfig.githubReleasesUrl);

    if (!response.ok) {
      throw new Error("Error al obtener las versiones");
    }

    const releases: GithubRelease[] = await response.json();

    const releasesInfo = releases.map((release) => ({
      version: release.tag_name,
      changelog: release.body,
      date: release.created_at,
      downloadUrl: release.assets.find((asset) =>
        asset.browser_download_url.endsWith(".exe")
      )?.browser_download_url,
    }));

    return releasesInfo;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}
