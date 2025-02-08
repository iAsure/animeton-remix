import { getReleasesInfo } from "@/lib/getReleasesInfo";
import { redirect } from "next/navigation";

export async function GET() {
  const releases = await getReleasesInfo();

  if (!releases) {
    return new Response("No releases found", { status: 404 });
  }

  if (!releases[0]?.downloadUrl) {
    return new Response("No download URL found", { status: 404 });
  }

  redirect(releases[0]?.downloadUrl);
}
