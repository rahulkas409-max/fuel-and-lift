import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fuel & Lift — gym tracker & meal planner",
    short_name: "Fuel & Lift",
    description: "Log workouts, plan high-protein Indian meals and track nutrition. Free, no sign-up.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafd",
    theme_color: "#f8fafd",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
