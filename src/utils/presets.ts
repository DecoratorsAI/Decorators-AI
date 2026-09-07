export interface JobPreset {
  id: string;
  title: string;
  tag: string;
  description: string;
}

export const UK_JOB_PRESETS: JobPreset[] = [
  {
    id: "bedroom-fresh-plaster",
    title: "Master Bedroom (Fresh Plaster)",
    tag: "Interior",
    description:
      "Master bedroom 4.2m x 3.6m with 2.5m ceiling. Ceiling and one feature wall have fresh skimmed plaster (requires mist coat). Other 3 walls need 2 coats durable matt. 2 doors, frame, window cill and 16m skirting to be prepared and finished in white satinwood.",
  },
  {
    id: "hall-stairs-landing",
    title: "Hallway, Stairs & Landing",
    tag: "High Traffic",
    description:
      "2-storey hallway, stairs and landing in 3-bed semi-detached. High traffic area with scuffs and picture hook holes. 14 spindle banister, stringer and handrail to sand and paint. Walls require washable durable matt (e.g. Johnstone's Cleanable or Dulux Diamond). 6 internal door frames.",
  },
  {
    id: "water-damage-ceiling",
    title: "Water Stain Living Room Ceiling",
    tag: "Stain Block",
    description:
      "Living room ceiling (5m x 4m) with historical water stain from resolved bathroom leak above. Watermark requires stain-blocking primer (Zinsser BIN) before 2 full coats of flat matt ceiling paint. Walls require 2 coats soft sheen. Minor plaster hairline shrinkage around coving.",
  },
  {
    id: "exterior-sash-windows",
    title: "Exterior Front Elevation & Sashes",
    tag: "Exterior",
    description:
      "Front elevation of Victorian terraced house. 4 wooden sliding sash windows with flaking gloss, requiring burning off/scraping, exterior filler, priming bare wood and 2 coats flexible exterior gloss. Front bay masonry wall and stone cills require 2 coats smooth masonry paint.",
  },
  {
    id: "kitchen-refresh",
    title: "Kitchen Refresh & Degreasing",
    tag: "Kitchen",
    description:
      "Kitchen diner 5m x 3m. Walls above worktops have light cooking grease requiring heavy sugar soap washdown. Repaint walls in mould-resistant moisture-proof eggshell/durable matt. Repaint ceiling in brilliant white. 1 exterior back door and frame.",
  },
];
