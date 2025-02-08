export interface BrandingColors {
  background: string;
  foreground: string;
  primary: {
    [key: string]: string;
    DEFAULT: string;
    foreground: string;
  };
  secondary: {
    [key: string]: string;
    DEFAULT: string;
    foreground: string;
  };
  focus: string;
}
