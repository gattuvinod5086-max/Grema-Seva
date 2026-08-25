/**
 * Logo and background image URLs for Telangana / Grama Seva branding.
 *
 * Official State Emblem: place the emblem image (gold ring, green ring with
 * "GOVERNMENT OF TELANGANA", Lion Capital, Kakatiya Kala Thoranam, Charminar)
 * at public/logo.png – it will be used as the primary logo everywhere.
 *
 * Other optional files: public/bg-map.png, public/thalli.png – then set
 * bgMap / telanganaThalli to "/bg-map.png" and "/thalli.png".
 */
export const BRANDING = {
  /**
   * Official State Emblem of Telangana (green + gold).
   * Use local public/logo.png so the emblem always loads; fallbacks below if missing.
   */
  logoEmblem: "/logo.png",
  /** Fallback if /logo.png is not present (Wikipedia emblem) */
  logoEmblemSvg: "https://upload.wikimedia.org/wikipedia/commons/3/36/Emblem_of_Telangana.svg",
  /** Last fallback (Telangana Govt site) */
  logoFallback: "https://telangana.gov.in/Style%20Library/GoT/img/logo.png",
  /**
   * Telangana district map for backgrounds (low opacity). Use "/bg-map.png" if you add public/bg-map.png.
   */
  bgMap:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Telangana_district_map.svg/800px-Telangana_district_map.svg.png",
  /** Same map or state image for Login left panel / hero sections */
  bgStateImage:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Telangana_district_map.svg/800px-Telangana_district_map.svg.png",
  /** Right-panel map: put public/bg-map.png to use yours; else this URL is used */
  mapPanel: "/bg-map.png",
  mapPanelFallback:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Telangana_district_map.svg/800px-Telangana_district_map.svg.png",
  /** Thalli: put public/thalli.png to use yours; else this URL is used */
  telanganaThalli: "/thalli.png",
  telanganaThalliFallback:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Statue_of_Telangana_thalli.jpg/400px-Statue_of_Telangana_thalli.jpg",
} as const;
