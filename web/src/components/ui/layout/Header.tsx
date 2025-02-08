import GradientBadge from "../GradientBadge";
import Logo from "../Logo";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-3 px-6 bg-background/60 backdrop-blur-md border-b border-primary-700/20">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="hidden md:block flex-1">
          {/* Espacio vacío a la izquierda para mantener el balance en desktop */}
        </div>
        <div className="flex items-baseline gap-2">
          <Logo size="lg" variant="header" />
          <GradientBadge text="beta" size="sm" />
        </div>
        <div className="hidden md:block flex-1">
          {/* Espacio vacío a la derecha para mantener el balance en desktop */}
        </div>
      </div>
    </header>
  );
}
