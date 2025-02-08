import React, { ReactNode } from "react";
import { Button } from "@nextui-org/button";
import { Icon } from "@iconify/react";
import { Tooltip } from "@nextui-org/tooltip";

interface Feature {
  icon?: string;
  label: string;
  text: ReactNode;
  comingSoon?: boolean;
  tooltip?: string;
}

const FeatureItem: React.FC<Feature> = ({
  icon,
  label,
  text,
  comingSoon = false,
  tooltip = "",
}) => (
  <li className="mb-2 flex items-center">
    {icon && (
      <Button
        isIconOnly
        color="primary"
        variant="faded"
        aria-label={label}
        className="rounded-full mr-2 min-w-8 w-8 min-h-8 h-8"
      >
        <Icon icon={icon} className="text-xl" />
      </Button>
    )}
    {text}
    {comingSoon && (
      <span className="text-secondary-300 font-semibold ml-2">
        (próximamente)
      </span>
    )}
    {tooltip && (
      <Tooltip
        content={
          <div className="px-1 py-2 max-w-sm">
            <div className="text-small font-bold">{tooltip}</div>
          </div>
        }
      >
        <Button
          isIconOnly
          color="primary"
          variant="faded"
          aria-label="Más información"
          className="rounded-full ml-2 min-w-8 w-8 min-h-8 h-8"
        >
          <Icon icon="mdi:question-mark" />
        </Button>
      </Tooltip>
    )}
  </li>
);

const features: Feature[] = [
  {
    icon: "mdi:cash-off",
    label: "Gratis",
    text: (
      <p>
        Completamente <u>gratis</u>
      </p>
    ),
  },
  {
    icon: "mdi:block-helper",
    label: "Sin publicidad",
    text: (
      <p>
        <u>Sin publicidad</u> molesta
      </p>
    ),
  },
  {
    icon: "mdi:high-definition",
    label: "Calidad HD",
    text: (
      <p>
        Calidad en <u>1080p</u>
      </p>
    ),
  },
  {
    icon: "mdi:play-circle",
    label: "Seguir viendo automático",
    text: <p>Seguir viendo automático</p>,
    comingSoon: true,
    tooltip:
      "Seguir viendo automático: Descarga y notifica nuevos episodios semanales. Continúa tu anime sin interrupciones, al estilo de Netflix.",
  },
  {
    label: "Sugerencias",
    text: <>Te gustaría ver algo en especial?</>,
    tooltip:
      "Con tu feedback podrás sugerir nuevas funcionalidades para la app.",
  },
];

export const FeatureItems: React.FC = () => (
  <ul className="text-left text-base sm:text-lg inline-block">
    {features.map((feature, index) => (
      <FeatureItem key={index} {...feature} />
    ))}
  </ul>
);
