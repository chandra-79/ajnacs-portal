import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

// TrueType container of the bundled Inter Latin WOFF2, covered by inter-OFL.txt.
// Explicit font selection keeps svg text independent of runner-installed fonts.
const fontFile = fileURLToPath(new URL("../assets/fonts/inter-latin-render.ttf", import.meta.url));

export function renderEditorialPng(svg) {
  return new Resvg(svg, {
    font: {
      loadSystemFonts: false,
      fontFiles: [fontFile],
      defaultFontFamily: "Inter",
      sansSerifFamily: "Inter",
    },
  }).render().asPng();
}
