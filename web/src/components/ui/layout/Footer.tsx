import Link from "next/link";
import { Icon } from "@iconify/react";
import { siteConfig } from "@/config/site";
import Logo from "../Logo";
import GradientBadge from "../GradientBadge";

export default function Footer() {
  return (
    <footer className="py-8 px-6 bg-background/60 backdrop-blur-md border-t border-primary-700/20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0 flex items-baseline gap-2">
          <Logo size="md" variant="footer" />
          <GradientBadge text="beta" size="sm" />
        </div>
        <div className="flex space-x-6">
          {Object.entries(siteConfig.links).map(([key, value]) => (
            <FooterLink key={key} href={value} icon={`mdi:${key} `} />
          ))}
        </div>
      </div>
    </footer>
  );
}

const FooterLink = ({ href, icon }: { href: string; icon: string }) => (
  <Link
    href={href}
    className="text-2xl text-primary-300 hover:text-primary-200 transition-colors"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Icon icon={icon} />
  </Link>
);
