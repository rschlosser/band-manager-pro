export type Palette = {
  scheme: "dark" | "light";
  bg: string;
  bgGlow: string;
  card: string;
  card2: string;
  line: string;
  txt: string;
  sub: string;
  acc: string;
  acc2: string;
  green: string;
  red: string;
  pink: string;
  amber: string;
  overlay: string;
};

export const darkPalette: Palette = {
  scheme: "dark",
  bg: "#0b0b12",
  bgGlow: "#2a1b4d",
  card: "#15151f",
  card2: "#1c1c29",
  line: "#2a2a3a",
  txt: "#f2f2f7",
  sub: "#8e8e9d",
  acc: "#a78bfa",
  acc2: "#7c3aed",
  green: "#34d399",
  red: "#f87171",
  pink: "#f472b6",
  amber: "#fbbf24",
  overlay: "rgba(0,0,0,0.6)",
};

export const lightPalette: Palette = {
  scheme: "light",
  bg: "#f4f3fa",
  bgGlow: "#d9cbfa",
  card: "#ffffff",
  card2: "#f0eefb",
  line: "#e3e1ee",
  txt: "#17162a",
  sub: "#6c6a80",
  acc: "#7c3aed",
  acc2: "#6d28d9",
  green: "#059669",
  red: "#dc2626",
  pink: "#db2777",
  amber: "#d97706",
  overlay: "rgba(20,16,40,0.35)",
};
