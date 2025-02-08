import { branding } from "./branding";

export const siteConfig = {
  apiUrl: "https://api.animeton.com/",
  githubReleasesUrl:
    "https://api.github.com/repos/Tiahui-Tech/anitorrent/releases",
  links: {
    video:
      "https://link.storjshare.io/s/jun54hyn6siquty3ldekn4fvnbga/animeton-com/background-2.webm?wrap=0",
    ...branding.socialMedia,
  },
};
