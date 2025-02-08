import React from "react";
import GradualSpacing from "@/components/ui/gradual-spacing";
import { FeatureItems } from "./FeatureItems";
import { JoinDiscordButton } from "./JoinDiscordButton";
import GradientBadge from "@/components/ui/GradientBadge";

export const HeroSection: React.FC = () => {
  return (
    <div className="max-w-4xl md:mr-6">
      <GradualSpacing
        className="hidden md:block text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6"
        text="La App de Windows para ver anime en Español"
      />
      <h1 className="md:hidden text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
        La App de Windows para ver anime en Español
      </h1>
      <div className="bg-background/60 backdrop-blur-md border border-primary-700/20 rounded-lg p-6 mb-6">
        <div className="max-w-3xl text-lg sm:text-xl mb-6">
          <p className="flex items-center mb-4">
            <span className="mr-3">Únete a nuestra</span>
            <GradientBadge text="beta cerrada" size="lg" />
          </p>
          <p>
            Tendrás acceso exclusivo a la app y serás parte de nuestra comunidad
            en Discord, donde podrás compartir tus ideas y sugerencias.
          </p>
        </div>
        <FeatureItems />
      </div>
      <div className="mt-2">
        <div className="flex flex-col sm:flex-row gap-4">
          <JoinDiscordButton />
        </div>
      </div>
    </div>
  );
};
