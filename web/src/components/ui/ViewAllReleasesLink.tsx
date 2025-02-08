import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const ViewAllReleasesLink: React.FC = () => {
  const formattedUrl = siteConfig.githubReleasesUrl
    .replace("api.", "")
    .replace("/repos", "")
    .replace("/releases", "/releases");

  return (
    <Link
      href={formattedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-300 hover:text-primary-200 transition-colors"
    >
      Ver todos los releases en GitHub
    </Link>
  );
};

export default ViewAllReleasesLink;
