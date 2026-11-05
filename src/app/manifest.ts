import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Forma — food, movement & daily rhythm",
    short_name: "Forma",
    description: "Log workouts, plan high-protein Indian meals and track nutrition. Free, no sign-up.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f4ef",
    theme_color: "#f5f4ef",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
