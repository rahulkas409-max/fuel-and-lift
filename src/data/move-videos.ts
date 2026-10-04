// Real demo videos (YouTube IDs) for home and yoga moves that have no free real photo.
// They play through YouTube's own embedded player, which YouTube allows on any site.
export const MOVE_VIDEOS: Record<string, string> = {
  "boat-pose": "QVEINjrYUPU",
  burpee: "OO7-dWIy0W8",
  butterfly: "kL-81iBucXo",
  "chair-pose": "tEZhXr0FuAQ",
  "chin-tuck": "gIBoxQ6AlS0",
  "downward-dog": "EC7RGJ975iM",
  "elbow-to-knee": "z1fwSujYhX8",
  "flutter-kicks": "rqyyVGT3vHI",
  "jaw-jut": "O8cP_TGKS68",
  kapalbhati: "52TOhE94fEg",
  "kiss-ceiling": "A0LnfXShmGw",
  "knee-push-up": "z8nUnCdZXQI",
  "neck-roll": "gBwGyIp5vdM",
  "pigeon-pose": "zuYbjkuKLKY",
  "pike-push-up": "2b5t0Cu2nQI",
  shavasana: "aIY7h-rBLNY",
  "shoulder-taps": "mPIym8BigIc",
  "surya-namaskar": "pykkDL98ZkQ",
  "tree-pose": "CKMNLYL0_GA",
  "wall-angel": "T_lqxtTAKM8",
  "wall-sit": "JaZNYM3zAP0",
  "warrior-2": "T8b28IuOl_E",
  "ytw-raise": "QdGTI4Lshg4",
};

export const ytThumb = (v: string) => `https://i.ytimg.com/vi/${v}/hqdefault.jpg`;
export const ytEmbed = (v: string) => `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&rel=0&playsinline=1`;
