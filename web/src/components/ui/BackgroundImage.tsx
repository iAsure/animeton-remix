import Image from "next/image";

interface BackgroundImageProps {
  placeholderImage: string;
  opacity?: number;
  filter?: string;
}

const BackgroundImage: React.FC<BackgroundImageProps> = ({
  placeholderImage,
  opacity = 0.5,
  filter = "brightness(50%)",
}) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-[0]">
      <Image
        src={placeholderImage}
        alt="Video placeholder"
        layout="fill"
        objectFit="cover"
        style={{ opacity, filter }}
      />
    </div>
  );
};

export default BackgroundImage;
