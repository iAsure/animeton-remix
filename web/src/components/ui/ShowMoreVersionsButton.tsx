import React from "react";
import { Button } from "@nextui-org/button";

interface ShowMoreVersionsButtonProps {
  showOlderReleases: boolean;
  onToggle: () => void;
}

export const ShowMoreVersionsButton: React.FC<ShowMoreVersionsButtonProps> = ({
  showOlderReleases,
  onToggle,
}) => {
  return (
    <Button
      color="primary"
      variant="ghost"
      onPress={onToggle}
      className="bg-background/30 backdrop-blur-md"
    >
      {showOlderReleases
        ? "Ocultar versiones anteriores"
        : "Ver versiones anteriores"}
    </Button>
  );
};

export default ShowMoreVersionsButton;
