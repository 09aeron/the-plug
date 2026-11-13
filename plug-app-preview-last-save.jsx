import React, { useState, useRef, useCallback, useEffect, useLayoutEffect, useContext, createContext, useMemo } from "react";
import {
  Menu, X, Plus, User, Search, Bookmark, BookOpen, BarChart3,
  Settings, Layers, GraduationCap, StickyNote, ChevronLeft,
  Maximize2, ChevronDown, ChevronRight, Clock, Flame, Star,
  TrendingUp, Award, Bell, Moon, FileText, Folder, Play, Check,
  Volume2, Shield, HelpCircle, LogOut, Palette, Database, Info,
  MoreVertical, Copy, Trash2, Archive, Share2, Pin, Edit3,
  ArrowUpDown, SlidersHorizontal, LayoutGrid, List, FolderPlus,
  Tag, Image, Video, Music, Link2, Paperclip, Globe, Target,
  Timer, CheckSquare, Lock, HardDrive, UploadCloud,
  DownloadCloud, Code2, FileBadge2, Wallpaper,
  ListChecks, FolderTree, Sun, Monitor, Type, Square, Minimize2, Zap, Sparkles,
  Contrast, Pipette, RotateCcw,
} from "lucide-react";

/* ============================================================
   SECTION 0 — THEME & DESIGN SYSTEM
   The "DNA" of the interface. Every visual property a component
   needs — color, spacing, radius, shadow, type, motion — is
   computed once here from the user's Appearance settings and
   handed out through useTheme(). Nothing in this section renders
   a page; it only produces tokens and the primitives (Section 0B)
   that read them. Pages keep their current look until they're
   migrated to these primitives in a later phase — this section is
   the foundation that migration will build on, not a redesign of
   any page today.
   ============================================================ */

// ---- Design tokens (static recipes — resolved per-render into the
// `theme` object below, so they react to Appearance settings). ----

const SPACING_BASE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32 };

const RADIUS_BASE = { sm: 6, md: 10, lg: 16, xl: 22, pill: 999 };

// Corner Style setting — scales every radius token uniformly, so "Extra
// Rounded" doesn't mean editing every component's border-radius by hand.
const CORNER_STYLE_SCALE = { subtle: 0.55, rounded: 1, extraRounded: 1.6 };
const CORNER_STYLE_OPTIONS = [
  { id: "subtle", label: "Subtle" },
  { id: "rounded", label: "Rounded" },
  { id: "extraRounded", label: "Extra Rounded" },
];

// Font Size setting — one multiplier applied to the whole type scale below,
// rather than swapping in a second set of hardcoded sizes.
const FONT_SIZE_SCALE = { small: 0.9, default: 1, large: 1.15 };
const FONT_SIZE_OPTIONS = [
  { id: "small", label: "Small" },
  { id: "default", label: "Default" },
  { id: "large", label: "Large" },
];

// The app's typography scale. Rounded, friendly, slightly playful — a
// touch more generous line-height and a touch less weight-jump between
// levels than a typical dense/dashboard scale, without borrowing anyone
// else's specific type system. Headings/titles/body/buttons/captions each
// get their own role instead of every component picking its own size.
const TYPE_SCALE_BASE = { heading: 22, title: 16, body: 14, caption: 11.5, button: 14 };
const TYPE_WEIGHTS = { heading: 700, title: 600, body: 400, caption: 500, button: 600 };
const TYPE_LINE_HEIGHT = { heading: 1.25, title: 1.35, body: 1.5, caption: 1.4, button: 1 };
const TYPE_LETTER_SPACING = { heading: "-0.01em", title: "-0.005em", body: "0", caption: "0.01em", button: "0" };

// Elevation levels, expressed as a function of an intensity multiplier so
// Interface Style can turn shadows up or down without a second shadow
// table. "none" always stays flat regardless of style.
// Dark surfaces sit on a near-black page, so a navy shadow tuned for a pale
// page all but disappears — the same opacities that read clearly in Light
// Mode go nearly invisible in Dark Mode. Dark mode keeps the same curve but
// shifts to a true-black tint at a higher base opacity, which is what
// actually produces visible depth against a dark background.
function buildShadowLevels(multiplier, isDark) {
  const rgb = isDark ? "0,0,0" : "15,23,42";
  const boost = isDark ? 1.7 : 1;
  const o = (base) => Math.max(0, Math.min(base * multiplier * boost, 0.95)).toFixed(3);
  return {
    none: "none",
    low: `0 1px 2px rgba(${rgb},${o(0.05)})`,
    medium: `0 4px 14px rgba(${rgb},${o(0.08)})`,
    high: `0 10px 28px rgba(${rgb},${o(0.12)})`,
    floating: `0 18px 44px rgba(${rgb},${o(0.18)})`,
  };
}

// Interface Style setting — a small preset bundle rather than one-off
// hardcoded tweaks: Soft leans into lower-contrast, low-shadow, more
// rounded surfaces; Modern leans into crisper borders and a touch more
// corner radius; Default sits between the two.
const INTERFACE_STYLES = {
  default: { shadowMultiplier: 1, borderOpacity: 1, radiusBoost: 1, surfaceTint: 0 },
  soft: { shadowMultiplier: 0.55, borderOpacity: 0.6, radiusBoost: 1.15, surfaceTint: 0.05 },
  modern: { shadowMultiplier: 1.25, borderOpacity: 1, radiusBoost: 1.1, surfaceTint: 0 },
};
const INTERFACE_STYLE_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "soft", label: "Soft" },
  { id: "modern", label: "Modern" },
];

// Motion tokens — Reduced Motion collapses every duration to 0 instead of
// components each deciding independently whether to animate.
const MOTION_BASE = { fast: 120, base: 180, slow: 260 };

// Accent Color options. Each has a mid and a strong shade (hover/pressed,
// "on accent" contrast text stays white for all of these). "custom" is
// handled separately via customAccentHex.
const ACCENT_PALETTES = {
  blue: { label: "Blue", 500: "#1CB0F6", 600: "#0F91D1" },
  green: { label: "Green", 500: "#58CC02", 600: "#46A302" },
  purple: { label: "Purple", 500: "#CE82FF", 600: "#A568E0" },
  orange: { label: "Orange", 500: "#FF9600", 600: "#E08600" },
  pink: { label: "Pink", 500: "#FF86D0", 600: "#E667B3" },
  red: { label: "Red", 500: "#FF4B4B", 600: "#E63E3E" },
  yellow: { label: "Yellow", 500: "#FFC800", 600: "#E0AF00" },
};
const ACCENT_OPTIONS = [...Object.entries(ACCENT_PALETTES).map(([id, v]) => ({ id, label: v.label, hex: v[500] })), { id: "custom", label: "Custom" }];

// Card Color presets — Prompt 10.3. A handful of neutral/tinted surface
// colors that read well as a card background in either mode; anything
// beyond these four goes through the full Card Color picker instead.
const CARD_COLOR_PRESETS = [
  { id: "slate", label: "Slate", hex: "#F1F5F9" },
  { id: "ivory", label: "Ivory", hex: "#FFF8EC" },
  { id: "mint", label: "Mint", hex: "#EAF7EF" },
  { id: "graphite", label: "Graphite", hex: "#20242C" },
];

// Wallpaper presets — Prompt 8A/Section "Wallpaper". Built as CSS gradients
// rather than hosted photos so the feature never depends on an external
// image URL resolving; "custom" (a future imported image) is architecture
// only for now — see the disabled tile in WallpaperPickerSheet.
const WALLPAPER_PRESETS = [
  { id: "none", label: "None", css: null },
  { id: "aurora", label: "Aurora", css: "linear-gradient(160deg, #4338CA 0%, #7C3AED 45%, #DB2777 100%)" },
  { id: "sunset", label: "Sunset", css: "linear-gradient(160deg, #F97316 0%, #EF4444 55%, #7C2D92 100%)" },
  { id: "forest", label: "Forest", css: "linear-gradient(160deg, #0F6B5C 0%, #14532D 55%, #052E16 100%)" },
  { id: "ocean", label: "Ocean", css: "linear-gradient(160deg, #0EA5E9 0%, #2563EB 55%, #1E3A8A 100%)" },
  { id: "midnight", label: "Midnight", css: "linear-gradient(160deg, #1E293B 0%, #0F172A 55%, #020617 100%)" },
];

// ---- Color math (shared by the accent color dialog and the automatic
// Primary/Secondary/Tertiary palette derivation below). Kept dependency-free
// so the theme engine never needs an external color library. ----
function clamp01(n) { return Math.max(0, Math.min(1, n)); }

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function rgbToHex(r, g, b) {
  const h = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(hue2rgb(h / 360 + 1 / 3) * 255),
    g: Math.round(hue2rgb(h / 360) * 255),
    b: Math.round(hue2rgb(h / 360 - 1 / 3) * 255),
  };
}
function hexToHsl(hex) { const { r, g, b } = hexToRgb(hex); return rgbToHsl(r, g, b); }
function hslToHex(h, s, l) { const { r, g, b } = hslToRgb(h, s, l); return rgbToHex(r, g, b); }

// ---- Physical-UI color helpers ----
// Every "tangible" surface (buttons, FAB, chips, sheets) needs a darker
// "side/ledge" companion to its face color and, occasionally, a lighter
// highlight — derived the same way Primary/Secondary/Tertiary are, so
// depth relationships hold for ANY accent color or neutral, not just the
// defaults shipped today. Nothing here is a hardcoded color.
function darken(hex, amount) {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}
function lighten(hex, amount) {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, Math.min(1, l + amount));
}
function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ------------------------------------------------------------
   Chunky / pressable design language for elements that aren't a plain
   text-and-icon <Button> (the hero card, workspace widgets, custom
   multi-line rows in pickers) — same underlying mechanism the app's
   real Button component uses (className="pui-press" + the
   --pui-depth/--pui-depth-color/--pui-elevation custom properties),
   and now reading the SAME buttonPrimaryBg/buttonSecondaryBg tokens
   Button's own recipes use, instead of approximating with c.primary/
   c.card. For anything that's just a label (+ maybe one icon), prefer
   the real <Button variant="primary|secondary"> component directly —
   this helper exists for surfaces Button's simple children API doesn't
   fit (icon-badge-plus-title-plus-subtitle layouts, etc).

   variant: "primary"   — matches Button's primary recipe (main CTAs).
   variant: "card"       — matches Button's secondary recipe (neutral,
             tappable containers/rows that aren't the loudest action
             on screen).

   Dense reading surfaces (note editor, long text lists) should NOT use
   this — kept quieter on purpose so the tactile, bouncy feel stays for
   things you tap to act on, not content you're reading.
   ------------------------------------------------------------ */
function chunkyVars(theme, variant = "primary", depth = 4) {
  const c = theme.colors;
  const isPrimary = variant === "primary";
  const bg = isPrimary ? c.buttonPrimaryBg : c.buttonSecondaryBg;
  const text = isPrimary ? c.buttonPrimaryText : c.buttonSecondaryText;
  return {
    background: bg,
    color: text,
    border: `2px solid ${isPrimary ? darken(bg, 0.16) : c.border}`,
    "--pui-depth": `${depth}px`,
    "--pui-depth-color": isPrimary ? darken(bg, 0.24) : darken(c.border, 0.1),
  };
}

// HSV <-> RGB, used only by the color-wheel/saturation-value picker UI
// (visually more intuitive to drag than HSL for choosing a color).
function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : d / max, v: max };
}
function hexToHsv(hex) { const { r, g, b } = hexToRgb(hex); return rgbToHsv(r, g, b); }
function hsvToHex(h, s, v) { const { r, g, b } = hsvToRgb(h, s, v); return rgbToHex(r, g, b); }

// Automatic accent palette — one user-picked color becomes three. Secondary
// is a lightened, gently desaturated companion (for softer fills/backgrounds);
// Tertiary is a deepened, slightly richer companion (for emphasis/contrast).
// Both stay in the same hue family as Primary so the palette always reads as
// "one accent, three tones" rather than three unrelated colors.
function deriveAccentPalette(hex) {
  const { h, s, l } = hexToHsl(hex);
  const primary = hex.toUpperCase();
  const primaryStrong = hslToHex(h, Math.min(1, s + 0.05), Math.max(0, l - 0.12));
  const secondary = hslToHex(h, Math.max(0, s - 0.15), Math.min(0.92, l + 0.22));
  const tertiary = hslToHex(h, Math.min(1, s + 0.08), Math.max(0.08, l - 0.24));
  return { primary, primaryStrong, secondary, tertiary };
}

// Semantic neutrals — everything that ISN'T the accent. Background/
// surface/card are three distinct layers (page < grouped surface < raised
// card) so depth stays legible without leaning on shadows alone.
const NEUTRALS_LIGHT = {
  background: "#F7F8FA",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  // Light Mode's surfaces were already legible via shadow + border alone,
  // so these three new levels stay white like `card` — Prompt 6B only asks
  // for Dark Mode polish, not a Light Mode redesign.
  cardElevated: "#FFFFFF",
  sheet: "#FFFFFF",
  dialog: "#FFFFFF",
  border: "#E4E7EC",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  muted: "#94A3B8",
  disabled: "#CBD5E1",
  overlay: "rgba(15,23,42,0.45)",
};
const NEUTRALS_DARK = {
  background: "#0B0F14",
  surface: "#141B23",
  // Lifted from #171F29 — the previous value sat only ~1.7% lightness
  // above `surface`, so a raised card barely separated from the surface
  // it sits on. Wider now (~4% above surface) so the background → surface
  // → card steps read as three distinct levels, matching the separation
  // light mode already has, without approaching pure black or a harsh gray.
  card: "#1B2531",
  // Three more rungs above `card`, each a consistent ~4% lightness step in
  // the same blue-gray hue family, so every layer of the app — a raised
  // "elevated" card, a bottom sheet, and a dialog stacked on top of a sheet
  // — reads as its own distinct depth instead of everything after
  // `background` collapsing into one indistinct dark gray.
  cardElevated: "#232E3D",
  sheet: "#2B3849",
  dialog: "#344356",
  border: "#28323F",
  textPrimary: "#F1F5F9",
  // Brightened from #66748A (4.05:1 on background) to a ~5:1 contrast so
  // secondary icons and captions read as crisp rather than faded, without
  // shifting hue or promoting it all the way to textSecondary's weight.
  textSecondary: "#98A6B8",
  muted: "#758399",
  disabled: "#33404F",
  overlay: "rgba(0,0,0,0.6)",
};
const STATUS_COLORS = {
  success: { light: "#16A34A", dark: "#22C55E" },
  warning: { light: "#D97706", dark: "#F59E0B" },
  danger: { light: "#DC2626", dark: "#EF4444" },
};

/* ------------------------------------------------------------
   Prompt 11A — Automatic Surface Brightness & Text Contrast
   Pure, theme-agnostic helpers: given any resolved surface color
   (a card, a sheet, a custom override — anything), work out
   whether it reads as light or dark and hand back a text-color
   trio that stays legible on it. These reuse the same carefully
   tuned text values NEUTRALS_LIGHT/NEUTRALS_DARK already define,
   so "readable on dark" and "readable on light" never drift into
   a second, slightly-different set of grays.
   ------------------------------------------------------------ */
// Standard relative-luminance formula (WCAG), 0 (black) – 1 (white).
function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
// A surface counts as "dark" once it drops below mid-gray luminance —
// the same threshold used to flip between light-on-dark and dark-on-light
// text everywhere below.
function isSurfaceDark(hex) {
  return relativeLuminance(hex) < 0.5;
}
// The single-color version: whatever sits on top of `surfaceHex`, this is
// the one color guaranteed to stay legible.
function getReadableTextColor(surfaceHex) {
  return isSurfaceDark(surfaceHex) ? NEUTRALS_DARK.textPrimary : NEUTRALS_LIGHT.textPrimary;
}
// The full hierarchy version — primary/secondary/disabled — for
// components that need more than one weight of text (a title plus a
// subtitle, a label plus a count) to stay in the correct relationship to
// each other regardless of which surface they're drawn on.
function getTextColorsForSurface(surfaceHex) {
  const n = isSurfaceDark(surfaceHex) ? NEUTRALS_DARK : NEUTRALS_LIGHT;
  return { textPrimary: n.textPrimary, textSecondary: n.textSecondary, muted: n.muted, textDisabled: n.disabled };
}
// Prompt 11B.2 — Surface-Aware Text Tokens. Turns one of the
// theme.surfaceText.<surface> entries (card / cardElevated / sheet /
// dialog / surface / background) into the four --pui-text-* CSS custom
// properties a component scopes onto its own root element. Any Text,
// Icon, chip, or timestamp rendered inside then reads the surface it's
// actually sitting on via normal CSS cascade, instead of the app-wide
// colors.textPrimary/etc — which is what keeps titles/chips/icons
// readable even when Card Color diverges from Light/Dark mode.
function surfaceVars(surfaceTextColors) {
  return {
    "--pui-text-primary": surfaceTextColors.textPrimary,
    "--pui-text-secondary": surfaceTextColors.textSecondary,
    "--pui-text-muted": surfaceTextColors.muted,
    "--pui-text-disabled": surfaceTextColors.textDisabled,
  };
}

const APPEARANCE_STORAGE_KEY = "appearance-settings";

// Each Interface Style now carries its own corner identity — Soft rounds off
// further, Modern stays crisper — so there's no separate "Corner Style"
// control duplicating the same decision with a second setting.
const INTERFACE_STYLE_CORNER = { default: "rounded", soft: "extraRounded", modern: "subtle" };

// Density replaces the old Compact Mode on/off toggle with a proper 3-point
// spectrum, so "how roomy should the app feel" is one intentional choice
// instead of a single binary flag.
const DENSITY_SCALE = { compact: 0.85, default: 1, comfortable: 1.15 };
const DENSITY_OPTIONS = [
  { id: "compact", label: "Compact" },
  { id: "default", label: "Default" },
  { id: "comfortable", label: "Comfortable" },
];

// The app's new default typeface — rounded, friendly, and highly readable,
// in the spirit of modern learning apps without copying any single one of
// them. Loaded once from Google Fonts and applied globally via a CSS
// variable so every themed primitive picks it up automatically.
const FONT_FAMILY = "'Quicksand', 'Nunito', 'Segoe UI', system-ui, sans-serif";
const FONT_FAMILY_GOOGLE_URL = "https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Nunito:wght@400;500;600;700&display=swap";

const DEFAULT_APPEARANCE = {
  mode: "system", // "light" | "dark" | "system"
  accent: "green",
  customAccentHex: "#1CB0F6",
  // Secondary/Tertiary are normally derived automatically from the accent
  // (see deriveAccentPalette) — a non-null entry here means the person has
  // manually edited that swatch after the fact. Changing Primary resets
  // both back to null so the palette "regenerates" per Prompt 8A #3.
  accentOverrides: { secondary: null, tertiary: null },
  // null = default themed neutral ladder (card/cardElevated/sheet/dialog).
  // A hex here overrides that whole ladder — see Prompt 8A #5.
  cardColorHex: null,
  wallpaper: "none", // one of WALLPAPER_PRESETS' ids
  // null = no tint. A hex here lays a translucent color overlay over the
  // wallpaper (or, with no wallpaper selected, over the plain background)
  // — Prompt 9A #3, for readability and a personal touch on top of a preset.
  wallpaperTintHex: null,
  iconPack: "default", // "default" | "custom1" | "custom2" — UI/architecture only for now
  // Prompt 9A #7 — Custom Pack 1/2 start empty until something is imported
  // into them; { label } is set once a file has been picked for that slot.
  customIconPacks: { custom1: null, custom2: null },
  interfaceStyle: "default", // "default" | "soft" | "modern" — also drives corner rounding
  fontSize: "default", // "small" | "default" | "large"
  density: "default", // "compact" | "default" | "comfortable"
  reducedMotion: false,
  largerText: false,
  highContrast: false, // future-ready, not yet implemented
};

const ThemeContext = createContext(null);
const ToastContext = createContext(null);

// The single source of every visual value in the app. Reads Appearance
// settings, resolves them (system dark-mode included) into a flat `theme`
// object of real colors/px values/shadow strings, and exposes CSS custom
// properties on a wrapping element so non-React CSS (and future plain
// utility classes like `text-[var(--color-primary)]`) can reference the
// same tokens. Changing one setting recomputes `theme` and every consumer
// re-renders with the new values — nothing needs its own copy of a color.
function ThemeProvider({ children }) {
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  // Tracks whether the person has ever touched the Reduced Motion toggle
  // themselves — until they do, the OS-level "prefers-reduced-motion"
  // setting drives it, same relationship systemDark has with "mode: system".
  const userSetReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches && !userSetReducedMotion.current) {
      setAppearance((a) => ({ ...a, reducedMotion: true }));
    }
    const onChange = (e) => {
      if (userSetReducedMotion.current) return;
      setAppearance((a) => ({ ...a, reducedMotion: e.matches }));
    };
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange));
  }, []);

  // Load the app's default typeface once. Guarded so it never double-injects
  // across remounts, and safe to no-op outside a browser environment.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("app-font-link")) return;
    const link = document.createElement("link");
    link.id = "app-font-link";
    link.rel = "stylesheet";
    link.href = FONT_FAMILY_GOOGLE_URL;
    document.head.appendChild(link);
  }, []);

  // The shared "physical" interaction language — every button, FAB, chip,
  // and sheet references these classes/keyframes instead of each component
  // re-deriving its own press mechanics. Colors and depth are still 100%
  // per-component (passed in as CSS custom properties), so this stylesheet
  // itself never hardcodes an accent, radius, or palette value — it only
  // defines the *behavior* (how a surface moves and settles).
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("pui-physical-styles")) return;
    const style = document.createElement("style");
    style.id = "pui-physical-styles";
    style.textContent = `
      @keyframes pui-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes pui-sheet-up { from { transform: translateY(24px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
      @keyframes pui-pop-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      @keyframes pui-drawer-in { from { transform: translateX(-16px); opacity: 0.7; } to { transform: translateX(0); opacity: 1; } }
      @keyframes pui-ripple { from { transform: scale(0); opacity: 0.28; } to { transform: scale(2.6); opacity: 0; } }
      @keyframes pui-toast-in { from { transform: translate(-50%, 12px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      @keyframes pui-check-pop { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes pui-shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
      @keyframes pui-screen-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pui-screen-in-back { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pui-pull-spin { to { transform: rotate(360deg); } }

      /* Section 14 — Accessibility: a hard, blanket floor under every
         per-component reduced-motion check above. theme.reducedMotion
         already zeroes --motion-* durations and many components already
         check it directly for their own keyframe animation, but this class
         (applied at the app root whenever reduced motion is on, from
         either the in-app toggle or the OS-level prefers-reduced-motion
         setting) guarantees nothing — including a future component that
         forgets to check — ships a moving animation. */
      .pui-reduced-motion, .pui-reduced-motion * {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
        scroll-behavior: auto !important;
      }

      /* Section 9 — momentum scrolling on every scroll container, and a
         visible (but native, not custom-built) scrollbar suppressed only
         where a horizontal strip is meant to read as swipeable content
         rather than a document. */
      .pui-scroll { -webkit-overflow-scrolling: touch; scroll-behavior: smooth; }
      .pui-reduced-motion .pui-scroll { scroll-behavior: auto; }

      /* Section 9 — fade edge: a horizontal strip masks only its right few
         pixels to transparent, hinting "more content" without a hard cut.
         The left edge stays fully opaque — these strips always start at
         their first item at rest, so a left fade only made that first item
         look clipped/blurry, it never indicated real scrollable content
         behind it. Pure CSS (mask-image), no JS scroll-position bookkeeping. */
      .pui-edge-fade-x {
        -webkit-mask-image: linear-gradient(to right, black calc(100% - 20px), transparent);
        mask-image: linear-gradient(to right, black calc(100% - 20px), transparent);
      }

      /* BottomSheet's overall height cap. vh is the safe universal
         baseline; dvh (where supported) accounts for mobile browser
         chrome/safe areas so the sheet's real available height matches
         the actual visible viewport instead of the address-bar-inclusive
         100vh some mobile browsers report. */
      .pui-sheet-max-h { max-height: 80vh; }
      @supports (max-height: 80dvh) {
        .pui-sheet-max-h { max-height: 80dvh; }
      }

      /* Section 14 — a consistent focus ring for keyboard/switch-control
         navigation, in the accent color, that only appears for
         keyboard focus (not mouse/touch presses). */
      .pui-press:focus-visible, .pui-lift:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      /* A surface with visible depth: a solid "ledge" beneath it (the
         --pui-depth-color offset by --pui-depth) that the surface sinks
         into on press, settling back on release. A soft inset highlight
         near the top edge and a faint inset shade near the bottom give it
         a molded, physical face instead of a flat color swatch — the
         shine dims and the sink-in shadow appears together on press, so
         the surface reads as settling downward rather than just moving.
         Easing is a restrained ease-out (no overshoot past the resting
         position) rather than a spring — same press distance and shadow
         mechanics as before, just a calmer, more premium settle instead
         of a playful bounce. ~160ms covers both the press-in and the
         release-back so the motion reads as one continuous gesture. */
      .pui-press {
        position: relative;
        transform: translateY(0);
        box-shadow: var(--pui-elevation, none),
                    0 var(--pui-depth, 3px) 0 0 var(--pui-depth-color, rgba(15,23,42,0.18)),
                    inset 0 1px 0 var(--pui-top-highlight, rgba(255,255,255,0.32)),
                    inset 0 -1px 1px var(--pui-inset-bottom, rgba(15,23,42,0.05));
        transition: transform 160ms cubic-bezier(0.22, 0.61, 0.36, 1),
                    box-shadow 160ms cubic-bezier(0.22, 0.61, 0.36, 1),
                    background-color var(--motion-base, 180ms) ease,
                    border-color var(--motion-base, 180ms) ease,
                    color var(--motion-base, 180ms) ease;
        will-change: transform;
        overflow: hidden;
      }
      .pui-press:active:not(:disabled) {
        transform: translateY(var(--pui-depth, 3px));
        box-shadow: 0 1px 2px var(--pui-active-ambient, rgba(15,23,42,0.12)), 0 0 0 0 var(--pui-depth-color, rgba(15,23,42,0.18)),
                    inset 0 1px 3px var(--pui-active-inset, rgba(15,23,42,0.12));
      }
      .pui-press:disabled {
        cursor: not-allowed;
        box-shadow: none;
      }

      /* Lighter-weight version for cards/inputs/chips — no solid ledge,
         just a smooth, restrained settle on hover/select/focus. Same
         ease-out curve as .pui-press so every pressable surface in the
         app — buttons, cards, chips, FABs, menu rows, dialogs — settles
         with one consistent, non-bouncy motion language. */
      .pui-lift {
        transition: transform 160ms cubic-bezier(0.22, 0.61, 0.36, 1),
                    box-shadow 160ms cubic-bezier(0.22, 0.61, 0.36, 1),
                    background-color var(--motion-base, 180ms) ease,
                    border-color var(--motion-base, 180ms) ease,
                    color var(--motion-base, 180ms) ease;
      }

      /* Section 6 (Prompt 8B) — Hover, for pointer devices only. Every
         pressable surface in the app shares .pui-press or .pui-lift, so one
         rule here covers buttons, the FAB, cards, chips, menu rows, and nav
         items at once instead of each component adding its own hover. Gated
         behind (hover: hover) so touch devices — which report a "hover" on
         tap that never clears — never get a stuck hover state. A gentle
         partial lift + brightness reads as "responsive" without previewing
         the press-down motion itself. */
      @media (hover: hover) and (pointer: fine) {
        .pui-press:hover:not(:disabled) {
          transform: translateY(calc(var(--pui-depth, 3px) * -0.3));
          filter: brightness(1.035);
        }
        .pui-lift:hover:not(:disabled) {
          filter: brightness(1.035);
        }
      }

      /* Section 5 (Prompt 8B) — Playful, for secondary/delight moments only
         (switches, active chips/tabs). Buttons and Cards keep the calmer,
         restrained ease-out above on purpose — this curve is reserved for
         smaller accents that can afford a little bounce without the whole
         interface feeling bouncy. */
      .pui-playful {
        transition: transform var(--motion-base, 180ms) cubic-bezier(0.34, 1.56, 0.64, 1),
                    background-color var(--motion-base, 180ms) ease,
                    box-shadow var(--motion-base, 180ms) ease;
      }
    `;
    document.head.appendChild(style);
  }, []);

  const resolvedMode = appearance.mode === "system" ? (systemDark ? "dark" : "light") : appearance.mode;
  const isDark = resolvedMode === "dark";

  const theme = useMemo(() => {
    const accentInputHex = appearance.accent === "custom" ? appearance.customAccentHex : ACCENT_PALETTES[appearance.accent]?.[500] || ACCENT_PALETTES.green[500];
    // One chosen color becomes a small family of tones — Primary is exactly
    // what the user picked; Secondary/Tertiary are generated automatically so
    // components can pull a lighter or deeper companion instead of reusing
    // Primary everywhere.
    const accentPalette = deriveAccentPalette(accentInputHex);
    const neutrals = isDark ? NEUTRALS_DARK : NEUTRALS_LIGHT;
    const style = INTERFACE_STYLES[appearance.interfaceStyle] || INTERFACE_STYLES.default;
    const cornerScale = CORNER_STYLE_SCALE[INTERFACE_STYLE_CORNER[appearance.interfaceStyle]] ?? 1;
    const fontScale = (FONT_SIZE_SCALE[appearance.fontSize] ?? 1) * (appearance.largerText ? 1.15 : 1);
    const spaceScale = DENSITY_SCALE[appearance.density] ?? 1;
    const motionScale = appearance.reducedMotion ? 0 : 1;

    // Prompt 8A #3 — Accent Palette: Secondary/Tertiary stay auto-derived
    // from Primary unless the person has manually edited that swatch
    // (accentOverrides), in which case the override wins until Primary
    // changes again and clears it (see setAccent/setCustomAccentHex below).
    const accentSecondary = appearance.accentOverrides?.secondary || accentPalette.secondary;
    const accentTertiary = appearance.accentOverrides?.tertiary || accentPalette.tertiary;

    // Prompt 9A #6 — Interface Accent removed: the Accent Palette's Primary
    // swatch is now the single source for every functional/interactive
    // surface (buttons, FAB, headers, chips, tabs, progress, switches, ...).
    // Every one of those already reads colors.primary/primaryStrong, so
    // this one assignment is what gives Accent Palette real app-wide effect
    // — no second color to keep in sync.

    // Prompt 8A #5 — Card Color: an independent override for every
    // card/panel/sheet/dialog surface, separate from Wallpaper (which only
    // affects the page background) and separate from Accent (which never
    // touched neutrals before). Light Mode mirrors the existing default
    // pattern of one flat tone across all four levels; Dark Mode rebuilds
    // the same ~4%-per-step elevation ladder the default neutrals use, just
    // starting from the custom base instead of the built-in navy.
    const cardBase = appearance.cardColorHex;
    const cardLadder = !cardBase
      ? { card: neutrals.card, cardElevated: neutrals.cardElevated, sheet: neutrals.sheet, dialog: neutrals.dialog }
      : isDark
      ? { card: cardBase, cardElevated: lighten(cardBase, 0.04), sheet: lighten(cardBase, 0.08), dialog: lighten(cardBase, 0.12) }
      : { card: cardBase, cardElevated: cardBase, sheet: cardBase, dialog: cardBase };

    // Prompt 8A #4 — Wallpaper: resolved here so it travels through the
    // same theme object as everything else; applied at the app root (see
    // AppShell) so it sits consistently behind every page. Prompt 9A #3
    // layers an optional translucent tint on top — as its own gradient
    // layer, not a color-mix — so it works whether or not a wallpaper
    // preset is selected, and never has to know what's underneath it.
    const wallpaperBaseCss = (WALLPAPER_PRESETS.find((w) => w.id === appearance.wallpaper) || WALLPAPER_PRESETS[0]).css;
    const wallpaperCss = appearance.wallpaperTintHex
      ? `linear-gradient(${withAlpha(appearance.wallpaperTintHex, 0.38)}, ${withAlpha(appearance.wallpaperTintHex, 0.38)})${wallpaperBaseCss ? `, ${wallpaperBaseCss}` : ""}`
      : wallpaperBaseCss;

    const colors = {
      primary: accentPalette.primary,
      primaryStrong: accentPalette.primaryStrong,
      accentSecondary,
      accentTertiary,
      secondary: neutrals.textSecondary,
      accent: accentPalette.primary,
      success: STATUS_COLORS.success[isDark ? "dark" : "light"],
      warning: STATUS_COLORS.warning[isDark ? "dark" : "light"],
      danger: STATUS_COLORS.danger[isDark ? "dark" : "light"],
      background: neutrals.background,
      surface: neutrals.surface,
      card: cardLadder.card,
      cardElevated: cardLadder.cardElevated,
      sheet: cardLadder.sheet,
      dialog: cardLadder.dialog,
      border: neutrals.border,
      textPrimary: neutrals.textPrimary,
      textSecondary: neutrals.textSecondary,
      muted: neutrals.muted,
      disabled: neutrals.disabled,
      overlay: neutrals.overlay,
      // Automatic instead of a hardcoded "#FFFFFF" — Primary is usually
      // dark enough for white text, but a very light custom accent (a pale
      // yellow, say) would make white unreadable. Deriving it the same way
      // every other surface's text is derived keeps that safe by
      // construction instead of by convention.
      onAccent: getReadableTextColor(accentPalette.primary),
      // Prompt 11B.1 — Button Isolation Tokens. Buttons must never be able
      // to inherit Card Color, so these are derived directly from the
      // accent palette and the neutrals ladder (surface/background) —
      // never from cardLadder.card / cardLadder.cardElevated. Card Color
      // only ever touches card/cardElevated/sheet/dialog above; nothing
      // here reads from that ladder, so a Card Color change can't ripple
      // into a button by accident.
      buttonPrimaryBg: accentPalette.primary,
      buttonPrimaryText: getReadableTextColor(accentPalette.primary),
      buttonSecondaryBg: neutrals.surface,
      buttonSecondaryText: getReadableTextColor(neutrals.surface),
      buttonGhostText: getReadableTextColor(neutrals.background),
    };

    // Prompt 11A — Semantic Theme Tokens. A second, purpose-named layer
    // over the same values above (nothing new is computed here except the
    // divider tint) so shared components can read `tokens.textDisabled`
    // instead of the shorter, more historically-named `colors.disabled`.
    // Both layers stay in sync automatically since tokens just aliases
    // colors — this is additive, not a replacement, so nothing outside
    // the shared primitives touched in this pass needs to change yet.
    const tokens = {
      background: colors.background,
      surface: colors.surface,
      surfaceElevated: cardLadder.cardElevated,
      card: colors.card,
      primaryAccent: colors.primary,
      secondaryAccent: colors.accentSecondary,
      tertiaryAccent: colors.accentTertiary,
      textPrimary: colors.textPrimary,
      textSecondary: colors.textSecondary,
      textDisabled: colors.disabled,
      border: colors.border,
      // Deliberately fainter than `border` — dividers separate rows within
      // one surface, borders separate one surface from another.
      divider: withAlpha(colors.border, isDark ? 0.6 : 0.8),
      success: colors.success,
      warning: colors.warning,
      error: colors.danger,
    };

    // Every surface a shared component can actually paint onto, each with
    // its own auto-contrast text trio. Because these are derived from the
    // real resolved color (which already accounts for a custom Card Color
    // override), a component that reads e.g. `surfaceText.card.textPrimary`
    // stays legible even when Card Color diverges from the app's overall
    // Light/Dark mode — the scenario a flat isDark check would get wrong.
    const surfaceText = {
      background: getTextColorsForSurface(colors.background),
      surface: getTextColorsForSurface(colors.surface),
      card: getTextColorsForSurface(cardLadder.card),
      cardElevated: getTextColorsForSurface(cardLadder.cardElevated),
      sheet: getTextColorsForSurface(cardLadder.sheet),
      dialog: getTextColorsForSurface(cardLadder.dialog),
    };

    const radius = Object.fromEntries(
      Object.entries(RADIUS_BASE).map(([k, v]) => [k, k === "pill" ? 999 : Math.round(v * cornerScale * style.radiusBoost)])
    );
    const spacing = Object.fromEntries(Object.entries(SPACING_BASE).map(([k, v]) => [k, Math.round(v * spaceScale)]));
    const typography = Object.fromEntries(
      Object.entries(TYPE_SCALE_BASE).map(([k, v]) => [k, Math.round(v * fontScale * 100) / 100])
    );
    const shadows = buildShadowLevels(style.shadowMultiplier, isDark);
    const motion = Object.fromEntries(Object.entries(MOTION_BASE).map(([k, v]) => [k, Math.round(v * motionScale)]));

    const cssVars = {
      "--color-primary": colors.primary,
      "--color-primary-strong": colors.primaryStrong,
      "--color-accent": colors.accent,
      "--color-accent-secondary": colors.accentSecondary,
      "--color-accent-tertiary": colors.accentTertiary,
      "--color-success": colors.success,
      "--color-warning": colors.warning,
      "--color-danger": colors.danger,
      "--color-background": colors.background,
      "--color-surface": colors.surface,
      "--color-card": colors.card,
      "--color-card-elevated": colors.cardElevated,
      "--color-sheet": colors.sheet,
      "--color-dialog": colors.dialog,
      "--color-border": colors.border,
      "--color-text-primary": colors.textPrimary,
      "--color-text-secondary": colors.textSecondary,
      "--color-muted": colors.muted,
      "--color-disabled": colors.disabled,
      "--color-overlay": colors.overlay,
      "--color-on-accent": colors.onAccent,
      // Prompt 11B.1 — kept separate from --color-card / --color-primary so
      // nothing downstream can accidentally wire a button to Card Color.
      "--color-button-primary-bg": colors.buttonPrimaryBg,
      "--color-button-primary-text": colors.buttonPrimaryText,
      "--color-button-secondary-bg": colors.buttonSecondaryBg,
      "--color-button-secondary-text": colors.buttonSecondaryText,
      "--color-button-ghost-text": colors.buttonGhostText,
      "--color-surface-elevated": tokens.surfaceElevated,
      "--color-divider": tokens.divider,
      // Prompt 11A — these three re-declare the same values as
      // --color-text-primary/secondary/disabled above, but under names a
      // shared surface component (Card, ItemCard, BottomSheet, ...) can
      // shadow locally with its own auto-contrast result. Any Text/Icon
      // that reads --pui-text-* instead of --color-text-* then picks up
      // the nearest surface's contrast automatically via normal CSS
      // custom-property cascading — no per-component prop needed.
      "--pui-text-primary": colors.textPrimary,
      "--pui-text-secondary": colors.textSecondary,
      "--pui-text-muted": colors.muted,
      "--pui-text-disabled": colors.disabled,
      "--radius-sm": `${radius.sm}px`,
      "--radius-md": `${radius.md}px`,
      "--radius-lg": `${radius.lg}px`,
      "--radius-xl": `${radius.xl}px`,
      "--radius-pill": "999px",
      "--space-xs": `${spacing.xs}px`,
      "--space-sm": `${spacing.sm}px`,
      "--space-md": `${spacing.md}px`,
      "--space-lg": `${spacing.lg}px`,
      "--space-xl": `${spacing.xl}px`,
      "--space-2xl": `${spacing["2xl"]}px`,
      "--shadow-low": shadows.low,
      "--shadow-medium": shadows.medium,
      "--shadow-high": shadows.high,
      "--shadow-floating": shadows.floating,
      "--font-heading": `${typography.heading}px`,
      "--font-title": `${typography.title}px`,
      "--font-body": `${typography.body}px`,
      "--font-caption": `${typography.caption}px`,
      "--font-button": `${typography.button}px`,
      "--font-family": FONT_FAMILY,
      "--motion-fast": `${motion.fast}ms`,
      "--motion-base": `${motion.base}ms`,
      "--motion-slow": `${motion.slow}ms`,
      // Physical-press highlight/shadow tint, themed once here so every
      // .pui-press/.pui-lift surface (buttons, FAB, cards, chips, nav)
      // gets richer top-lighting and a deeper settle-shadow in Dark Mode
      // without each component having to special-case isDark itself. Light
      // Mode keeps the exact values it always had.
      "--pui-top-highlight": isDark ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.32)",
      "--pui-inset-bottom": isDark ? "rgba(0,0,0,0.4)" : "rgba(15,23,42,0.05)",
      "--pui-active-ambient": isDark ? "rgba(0,0,0,0.5)" : "rgba(15,23,42,0.12)",
      "--pui-active-inset": isDark ? "rgba(0,0,0,0.5)" : "rgba(15,23,42,0.12)",
    };

    return {
      isDark,
      colors,
      // Prompt 11A additions — see the tokens/surfaceText block above.
      // `colors` is untouched and every existing call site keeps working;
      // these are additive so the shared components below (and 11B/11C
      // later) have a proper semantic layer to move onto.
      tokens,
      surfaceText,
      getTextColorsForSurface,
      radius,
      spacing,
      typography: Object.fromEntries(Object.keys(TYPE_SCALE_BASE).map((k) => [k, { size: typography[k], weight: TYPE_WEIGHTS[k], lineHeight: TYPE_LINE_HEIGHT[k], letterSpacing: TYPE_LETTER_SPACING[k] }])),
      fontFamily: FONT_FAMILY,
      shadows,
      motion,
      cssVars,
      borderOpacity: style.borderOpacity,
      surfaceTint: style.surfaceTint,
      reducedMotion: appearance.reducedMotion,
      density: appearance.density,
      interfaceStyle: appearance.interfaceStyle,
      fontSize: appearance.fontSize,
      largerText: appearance.largerText,
      highContrast: appearance.highContrast,
      // Appearance-page-only extras: the Accent Palette in its raw form
      // (primary/secondary/tertiary together, for the three swatches),
      // plus the resolved Wallpaper CSS/tint and icon pack state for the
      // Display and Icon Packs sections.
      accentPalette: { primary: accentPalette.primary, secondary: accentSecondary, tertiary: accentTertiary },
      cardColorHex: appearance.cardColorHex,
      wallpaperCss,
      wallpaperId: appearance.wallpaper,
      wallpaperTintHex: appearance.wallpaperTintHex,
      iconPack: appearance.iconPack,
      customIconPacks: appearance.customIconPacks,
    };
  }, [appearance, isDark]);

  // Changing Primary "regenerates complementary colors" (Prompt 8A #3) by
  // clearing any manual Secondary/Tertiary overrides — they fall back to
  // deriveAccentPalette's fresh output until edited again.
  const setMode = (mode) => setAppearance((a) => ({ ...a, mode }));
  const setAccent = (accent) => setAppearance((a) => ({ ...a, accent, accentOverrides: { secondary: null, tertiary: null } }));
  const setCustomAccentHex = (hex) => setAppearance((a) => ({ ...a, accent: "custom", customAccentHex: hex, accentOverrides: { secondary: null, tertiary: null } }));
  const setAccentOverride = (key, hex) => setAppearance((a) => ({ ...a, accentOverrides: { ...a.accentOverrides, [key]: hex } }));
  // Random Palette: a fresh random hue becomes the new Primary, which also
  // regenerates Secondary/Tertiary via the reset above.
  const randomizeAccentPalette = () => {
    const hex = hslToHex(Math.random() * 360, 0.55 + Math.random() * 0.25, 0.42 + Math.random() * 0.14);
    setCustomAccentHex(hex);
  };
  const setCardColorHex = (hex) => setAppearance((a) => ({ ...a, cardColorHex: hex }));
  const resetCardColor = () => setAppearance((a) => ({ ...a, cardColorHex: null }));
  const setWallpaper = (wallpaper) => setAppearance((a) => ({ ...a, wallpaper }));
  const setWallpaperTint = (wallpaperTintHex) => setAppearance((a) => ({ ...a, wallpaperTintHex }));
  const resetWallpaperTint = () => setAppearance((a) => ({ ...a, wallpaperTintHex: null }));
  const setIconPack = (iconPack) => setAppearance((a) => ({ ...a, iconPack }));
  // Prompt 9A #7 — importing a pack always fills the first empty Custom
  // slot (Default can never be overwritten) and switches to it immediately;
  // once both custom slots are full, importing again replaces Custom 1.
  const importIconPack = (label) => setAppearance((a) => {
    const slot = !a.customIconPacks.custom1 ? "custom1" : !a.customIconPacks.custom2 ? "custom2" : "custom1";
    return { ...a, customIconPacks: { ...a.customIconPacks, [slot]: { label } }, iconPack: slot };
  });
  const setInterfaceStyle = (interfaceStyle) => setAppearance((a) => ({ ...a, interfaceStyle }));
  const setFontSize = (fontSize) => setAppearance((a) => ({ ...a, fontSize }));
  const setDensity = (density) => setAppearance((a) => ({ ...a, density }));
  const setReducedMotion = (reducedMotion) => { userSetReducedMotion.current = true; setAppearance((a) => ({ ...a, reducedMotion })); };
  const setLargerText = (largerText) => setAppearance((a) => ({ ...a, largerText }));
  const setHighContrast = (highContrast) => setAppearance((a) => ({ ...a, highContrast }));
  const resetAppearance = () => setAppearance(DEFAULT_APPEARANCE);
  // Prompt 8A #1 — Import Theme. Only known, well-typed keys are merged in,
  // so a hand-edited or corrupted file can't leave `appearance` in a shape
  // the rest of the app doesn't expect.
  const importAppearance = (data) => {
    if (!data || typeof data !== "object") return false;
    const allowedKeys = [
      "mode", "accent", "customAccentHex", "accentOverrides",
      "cardColorHex", "wallpaper", "wallpaperTintHex", "iconPack", "customIconPacks", "interfaceStyle", "fontSize", "density",
    ];
    const next = {};
    for (const key of allowedKeys) if (key in data) next[key] = data[key];
    if (Object.keys(next).length === 0) return false;
    setAppearance((a) => ({ ...a, ...next }));
    return true;
  };

  const value = {
    theme,
    appearance,
    resolvedMode,
    setMode,
    setAccent,
    setCustomAccentHex,
    setAccentOverride,
    randomizeAccentPalette,
    setCardColorHex,
    resetCardColor,
    setWallpaper,
    setWallpaperTint,
    resetWallpaperTint,
    setIconPack,
    importIconPack,
    setInterfaceStyle,
    setFontSize,
    setDensity,
    setReducedMotion,
    setLargerText,
    setHighContrast,
    resetAppearance,
    importAppearance,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={theme.reducedMotion ? "pui-reduced-motion" : undefined} style={{ ...theme.cssVars, background: theme.colors.background, minHeight: "100%", fontFamily: FONT_FAMILY }}>{children}</div>
    </ThemeContext.Provider>
  );
}

// The one hook every themed component uses instead of hardcoding a color,
// radius, spacing, shadow, or type value. Throws if used outside the
// provider so a missing <ThemeProvider> fails loudly during development
// instead of silently rendering unstyled.
function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

// Section 6 — Success Feedback: a small stack of auto-dismissing toasts
// instead of dialogs — "Course created", "Note saved", "Review complete"
// all read the same way, a tiny check-pop plus a short message, gone in a
// couple seconds with no click required to dismiss. Any component calls
// useToast().show(message) — no prop-threading a setter down through
// every page that might want to confirm something happened.
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastStack toasts={toasts} />
    </ToastContext.Provider>
  );
}

function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

function ToastStack({ toasts }) {
  const { theme } = useTheme();
  const c = theme.colors;
  if (!toasts.length) return null;
  return (
    <div className="fixed left-1/2 z-[60] flex flex-col items-center pointer-events-none" style={{ bottom: 88, gap: theme.spacing.xs }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center"
          style={{
            gap: theme.spacing.xs,
            background: theme.isDark ? c.surface : "#18181B",
            color: "#FFFFFF",
            borderRadius: theme.radius.pill,
            padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
            boxShadow: theme.shadows.floating,
            fontFamily: "var(--font-family)",
            fontSize: `${theme.typography.caption.size}px`,
            fontWeight: 600,
            transform: "translateX(-50%)",
            left: "50%",
            position: "relative",
            animation: theme.reducedMotion ? "none" : "pui-toast-in var(--motion-base) cubic-bezier(0.22,1,0.36,1)",
            whiteSpace: "nowrap",
          }}
        >
          <span
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 16,
              height: 16,
              background: t.tone === "danger" ? c.danger : c.success,
              animation: theme.reducedMotion ? "none" : "pui-check-pop var(--motion-slow) cubic-bezier(0.22,1,0.36,1.4)",
            }}
          >
            <Check size={11} color="#FFFFFF" strokeWidth={3} />
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   SECTION 0B — THEMED PRIMITIVES
   The reusable building blocks every future page redesign will
   compose with, each reading exclusively from useTheme() instead
   of hardcoding its own colors/spacing/radius. Existing pages
   keep using their current markup for now (see Section 0's
   header note) — these are additive, proven out today in the new
   Appearance page, and ready for other pages to adopt page-by-page
   in a later phase.
   ============================================================ */

// Centralized icon lookup. Any call site that wants a themed/replaceable
// icon uses <Icon name="..."/> instead of importing a lucide icon
// directly, so swapping in custom hand-drawn icons later is a change to
// this one table, not to every page that renders an icon. Existing direct
// lucide-react usage elsewhere in the app is untouched for now (see
// Section 0's header note) — this registry is where new/migrated icon
// usage should live going forward.
const ICON_REGISTRY = {
  flashcards: Bookmark,
  quiz: ListChecks,
  iceBreaker: Flame,
  clock: Clock,
  star: Star,
  play: Play,
  check: Check,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  settings: Settings,
  palette: Palette,
  moon: Moon,
  sun: Sun,
  monitor: Monitor,
  type: Type,
  square: Square,
  compact: Minimize2,
  motion: Zap,
  info: Info,
  help: HelpCircle,
};

function Icon({ name, size = 16, className = "", style }) {
  const Cmp = ICON_REGISTRY[name] || HelpCircle;
  return <Cmp size={size} className={className} style={style} />;
}

// Typography primitive — the app's whole type scale in one place. `variant`
// picks size/weight/line-height/letter-spacing from theme.typography;
// nothing here is a hardcoded px or font-weight value.
function Text({ as: As = "span", variant = "body", color, weight, className = "", style, children }) {
  const { theme } = useTheme();
  const t = theme.typography[variant] || theme.typography.body;
  return (
    <As
      className={className}
      style={{
        fontFamily: "var(--font-family)",
        fontSize: `${t.size}px`,
        fontWeight: weight ?? t.weight,
        lineHeight: t.lineHeight,
        letterSpacing: t.letterSpacing,
        color: color || "var(--pui-text-primary)",
        ...style,
      }}
    >
      {children}
    </As>
  );
}

const BUTTON_SIZE_PAD = {
  sm: (s) => `${s.spacing.xs}px ${s.spacing.md}px`,
  md: (s) => `${s.spacing.sm}px ${s.spacing.lg}px`,
  lg: (s) => `${s.spacing.md}px ${s.spacing.xl}px`,
};

// Section 2 — Ripple System: one accent-tinted circular expansion per
// press, clipped to the surface's own border radius (the parent needs
// overflow:hidden, which .pui-press already sets), fading out quickly
// rather than lingering like a default Material ripple. A plain click
// (keyboard Enter, programmatic .click()) has no pointer coordinates, so
// those fire no ripple — restraint over a fallback center-ripple keeps it
// feeling like a response to a touch, not decoration on every activation.
function usePlugRipple() {
  const [ripples, setRipples] = useState([]);
  const { theme } = useTheme();
  const onPointerDown = useCallback((e) => {
    if (theme.reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.4;
    const id = Date.now() + Math.random();
    setRipples((r) => [
      ...r,
      { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
    ]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 500);
  }, [theme.reducedMotion]);
  return { ripples, onPointerDown };
}

// Section 8 — Haptics: three intensities via the standard Vibration API,
// used only where the interface actually says something happened (a
// press registered, a review finished, a destructive action needs
// weight) — not fired on every hover or render. No-ops silently on
// desktop browsers and any device without navigator.vibrate ("if
// supported"), and is skipped entirely under reduced motion, since
// haptic buzz is its own kind of motion stimulus.
const HAPTIC_PATTERNS = { light: 8, medium: 20, heavy: [16, 40, 16] };
function triggerHaptic(intensity, reducedMotion) {
  if (reducedMotion) return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(HAPTIC_PATTERNS[intensity] ?? HAPTIC_PATTERNS.light);
}

function RippleLayer({ ripples, color = "rgba(255,255,255,0.6)" }) {
  if (!ripples.length) return null;
  return (
    <>
      {ripples.map((rp) => (
        <span
          key={rp.id}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: rp.x,
            top: rp.y,
            width: rp.size,
            height: rp.size,
            borderRadius: "9999px",
            background: color,
            pointerEvents: "none",
            animation: "pui-ripple 480ms ease-out forwards",
          }}
        />
      ))}
    </>
  );
}

// Button variants — primary/secondary/outline/ghost/destructive/success —
// every one of them derived from theme.colors so an accent-color change
// (or a switch to dark mode) repaints every button in the app with zero
// per-button changes.
const BUTTON_DEPTH_BY_SIZE = { sm: 3, md: 4, lg: 5 };

// Button variants — primary/secondary/outline/ghost/destructive/success —
// every one of them derived from theme.colors so an accent-color change
// (or a switch to dark mode) repaints every button in the app with zero
// per-button changes. Primary/destructive/success read as "the main
// action": a layered top-face gradient sitting on a solid depth ledge that
// the button sinks into on press. Secondary carries the same ledge in
// neutral tones so it still feels touchable without competing for
// attention. Outline keeps a thin ledge just enough to read as pressable.
// Ghost stays flat and light — a color wash on press, nothing to sink into.
function Button({ variant = "primary", size = "md", icon: IconCmp, iconPosition = "left", fullWidth, disabled, loading, onClick, children, className = "", type = "button" }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const depth = BUTTON_DEPTH_BY_SIZE[size] ?? 4;

  const recipes = {
    primary: {
      // Dark Mode gets more gradient travel (a brighter top, a slightly
      // deepened base) and a faint colored ambient shadow underneath the
      // normal elevation shadow — that colored glow-free ambient is what
      // makes the primary action read as "premium" rather than just "the
      // blue one" against a dark page.
      background: theme.isDark
        ? `linear-gradient(180deg, ${lighten(c.buttonPrimaryBg, 0.13)}, ${c.buttonPrimaryBg} 50%, ${darken(c.buttonPrimaryBg, 0.04)})`
        : `linear-gradient(180deg, ${lighten(c.buttonPrimaryBg, 0.06)}, ${c.buttonPrimaryBg})`,
      color: c.buttonPrimaryText,
      border: theme.isDark ? `1px solid ${withAlpha(lighten(c.buttonPrimaryBg, 0.3), 0.35)}` : "1px solid transparent",
      depth,
      depthColor: darken(c.buttonPrimaryBg, 0.18),
      elevation: theme.isDark ? `${theme.shadows.medium}, 0 6px 18px ${withAlpha(c.buttonPrimaryBg, 0.28)}` : theme.shadows.low,
    },
    secondary: {
      // Prompt 11B.1 — reads buttonSecondaryBg (derived from the neutrals
      // surface, not from Card Color) so Card Color can never leak into
      // this button, even indirectly through a gradient/border tint.
      background: theme.isDark
        ? `linear-gradient(180deg, ${lighten(c.buttonSecondaryBg, 0.035)}, ${c.buttonSecondaryBg})`
        : `linear-gradient(180deg, ${lighten(c.buttonSecondaryBg, 0.02)}, ${c.buttonSecondaryBg})`,
      color: c.buttonSecondaryText,
      border: `1px solid ${theme.isDark ? withAlpha("#FFFFFF", 0.07) : c.border}`,
      depth,
      depthColor: darken(c.border, theme.isDark ? 0.14 : 0.1),
      elevation: theme.isDark ? theme.shadows.low : "none",
    },
    outline: {
      background: theme.isDark ? withAlpha(c.primary, 0.08) : "transparent",
      color: c.primary,
      border: `1.5px solid ${c.primary}`,
      depth: Math.max(2, depth - 2),
      depthColor: withAlpha(c.primary, 0.22),
      elevation: "none",
    },
    // Third rung of the hierarchy: quieter than Secondary but still a
    // pressable ledge (a shallower one) so it never reads as flat text —
    // a tinted neutral face instead of Secondary's card-colored one.
    tertiary: {
      background: theme.isDark ? withAlpha(c.buttonGhostText, 0.07) : darken(c.background, 0.02),
      color: c.buttonGhostText,
      border: "1px solid transparent",
      depth: Math.max(2, depth - 2),
      depthColor: withAlpha(c.buttonGhostText, 0.12),
      elevation: "none",
    },
    ghost: {
      background: "transparent",
      color: c.buttonGhostText,
      border: "1px solid transparent",
      depth: 0,
      depthColor: "transparent",
      elevation: "none",
    },
    destructive: {
      // Prompt 11B.1 — text is computed against the actual button
      // background instead of a hardcoded "#FFFFFF", so a lighter danger
      // color (e.g. from a future theme) can't produce unreadable text.
      background: `linear-gradient(180deg, ${lighten(c.danger, 0.06)}, ${c.danger})`,
      color: getReadableTextColor(c.danger),
      border: "1px solid transparent",
      depth,
      depthColor: darken(c.danger, 0.18),
      elevation: theme.shadows.low,
    },
    success: {
      background: `linear-gradient(180deg, ${lighten(c.success, 0.06)}, ${c.success})`,
      color: getReadableTextColor(c.success),
      border: "1px solid transparent",
      depth,
      depthColor: darken(c.success, 0.18),
      elevation: theme.shadows.low,
    },
  };
  const r = recipes[variant] || recipes.primary;
  const isDisabled = disabled || loading;
  const isPhysical = r.depth > 0 && !isDisabled;
  const { ripples, onPointerDown } = usePlugRipple();

  // Disabled always reads as "can't be pressed" first and "primary/secondary/
  // etc." second — a flat, muted face with no ledge and no shine, rather
  // than every variant's disabled state just being its normal look dimmed.
  const disabledStyle = {
    background: c.background,
    color: c.disabled,
    border: `1px solid ${c.border}`,
  };

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      onPointerDown={isDisabled ? undefined : (e) => { onPointerDown(e); triggerHaptic("light", theme.reducedMotion); }}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center ${isPhysical ? "pui-press" : "pui-lift active:scale-[0.96]"} ${className}`}
      style={{
        background: disabled ? disabledStyle.background : r.background,
        color: disabled ? disabledStyle.color : r.color,
        border: disabled ? disabledStyle.border : r.border,
        borderRadius: `${theme.radius.md}px`,
        fontFamily: "var(--font-family)",
        fontSize: `${theme.typography.button.size}px`,
        fontWeight: theme.typography.button.weight,
        padding: BUTTON_SIZE_PAD[size](theme),
        gap: `${theme.spacing.xs}px`,
        width: fullWidth ? "100%" : undefined,
        cursor: isDisabled ? "not-allowed" : "pointer",
        marginBottom: isPhysical ? r.depth : undefined,
        overflow: "hidden",
        opacity: loading ? 0.85 : 1,
        ...(isPhysical
          ? { "--pui-elevation": r.elevation, "--pui-depth": `${r.depth}px`, "--pui-depth-color": r.depthColor }
          : {}),
      }}
    >
      {loading ? (
        <RotateCcw size={14} style={{ animation: theme.reducedMotion ? "none" : "pui-pull-spin 700ms linear infinite" }} />
      ) : (
        IconCmp && iconPosition === "left" && <IconCmp size={14} />
      )}
      {children}
      {IconCmp && iconPosition === "right" && <IconCmp size={14} />}
      <RippleLayer ripples={ripples} color={variant === "secondary" || variant === "outline" || variant === "tertiary" || variant === "ghost" ? withAlpha(c.primary, 0.18) : "rgba(255,255,255,0.5)"} />
    </button>
  );
}

// Card variants — default/outline/elevated — plus an optional illustration
// slot. The slot renders nothing until a caller passes `illustration`, so
// it's safe infrastructure today for the decorative artwork/user images
// planned later, without changing how any existing card looks.
function Card({ variant = "default", padding = "md", illustration, onClick, className = "", style, children }) {
  const { theme } = useTheme();
  const c = theme.colors;
  // A faint top-to-bottom gradient plus a soft inset highlight near the top
  // edge and an equally soft inset shade near the bottom give the card a
  // gently molded face — the same physical language Button/FAB already use
  // — instead of a single flat fill. Kept extremely subtle (a couple of
  // percent lightness) so it reads as "surface catching light" rather than
  // glassmorphism or a visible seam.
  // Dark Mode gets a touch more gradient travel (a visible lift toward the
  // top edge, a faint deepening toward the bottom) plus a true inner shadow
  // along the bottom edge instead of just a soft tint — together they read
  // as a gently molded, catching-the-light face rather than a flat color
  // swatch, while staying far short of anything that could be called a glow.
  const cardFace = theme.isDark
    ? `linear-gradient(180deg, ${lighten(c.card, 0.028)}, ${c.card} 60%, ${darken(c.card, 0.012)})`
    : `linear-gradient(180deg, ${lighten(c.card, 0.012)}, ${c.card})`;
  const cardGlow = theme.isDark
    ? `inset 0 1px 0 ${withAlpha("#FFFFFF", 0.06)}, inset 0 -1px 0 ${withAlpha("#000000", 0.18)}`
    : `inset 0 1px 0 ${withAlpha("#FFFFFF", 0.5)}, inset 0 -1px 0 ${withAlpha(c.textPrimary, 0.025)}`;
  // Elevated cards sit on their own brighter surface (cardElevated) rather
  // than reusing `card` at a bigger shadow — that's what actually separates
  // "a raised card" from "a normal card with more blur" in Dark Mode, where
  // shadow alone reads faintly against a dark page.
  const elevatedFace = theme.isDark
    ? `linear-gradient(180deg, ${lighten(c.cardElevated, 0.035)}, ${c.cardElevated} 55%, ${darken(c.cardElevated, 0.012)})`
    : `linear-gradient(180deg, ${lighten(c.cardElevated, 0.015)}, ${c.cardElevated})`;
  const elevatedGlow = theme.isDark
    ? `inset 0 1px 0 ${withAlpha("#FFFFFF", 0.08)}, inset 0 -1px 0 ${withAlpha("#000000", 0.2)}`
    : cardGlow;
  const variants = {
    default: { background: cardFace, border: `1px solid ${c.border}`, boxShadow: `${theme.shadows.low}, ${cardGlow}` },
    outline: { background: "transparent", border: `1px solid ${c.border}`, boxShadow: "none" },
    elevated: {
      background: elevatedFace,
      border: `1px solid ${withAlpha(theme.isDark ? "#FFFFFF" : c.border, theme.isDark ? 0.08 : 0.6)}`,
      boxShadow: `${theme.shadows.medium}, ${elevatedGlow}`,
    },
  };
  const Comp = onClick ? "button" : "div";
  // Prompt 11A — Automatic Text Contrast: an "outline" card has no fill of
  // its own (it shows whatever is behind it), so it inherits contrast from
  // its surroundings same as before. "default" and "elevated" do paint a
  // real surface (card / cardElevated), so they scope the shared
  // --pui-text-* vars to that surface's own auto-contrast result — any
  // Text, Icon, title, or subtitle rendered inside picks this up with no
  // per-instance color prop.
  const surfaceTextVars =
    variant === "elevated"
      ? theme.surfaceText.cardElevated
      : variant === "outline"
      ? null
      : theme.surfaceText.card;
  return (
    <Comp
      onClick={onClick}
      className={`w-full text-left pui-lift ${onClick ? "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]" : ""} ${className}`}
      style={{
        ...variants[variant],
        borderRadius: `${theme.radius.lg}px`,
        padding: `${theme.spacing[padding] ?? theme.spacing.md}px`,
        ...(surfaceTextVars ? surfaceVars(surfaceTextVars) : {}),
        ...style,
      }}
    >
      {illustration && (
        <div
          className="w-full flex items-center justify-center overflow-hidden"
          style={{ borderRadius: `${theme.radius.md}px`, background: theme.colors.background, minHeight: 96, marginBottom: theme.spacing.sm }}
        >
          {illustration}
        </div>
      )}
      {children}
    </Comp>
  );
}

function ThemedInput({ value, onChange, placeholder, icon: IconCmp, className = "", onFocus, onBlur, ...rest }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={`flex items-center pui-lift ${className}`}
      style={{
        background: c.surface,
        border: `1.5px solid ${focused ? c.primary : c.border}`,
        borderRadius: `${theme.radius.md}px`,
        padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
        gap: theme.spacing.xs,
        boxShadow: focused
          ? `0 0 0 4px ${withAlpha(c.primary, 0.14)}, inset 0 1px 2px ${withAlpha(c.textPrimary, 0.05)}`
          : `inset 0 1px 2px ${withAlpha(c.textPrimary, 0.04)}`,
      }}
    >
      {IconCmp && <IconCmp size={14} className="pui-lift" style={{ color: focused ? c.primary : c.muted }} />}
      <input
        value={value}
        onChange={onChange}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none min-w-0"
        style={{ fontFamily: "var(--font-family)", fontSize: `${theme.typography.body.size}px`, color: c.textPrimary }}
        {...rest}
      />
    </div>
  );
}

function ThemedChip({ label, active, disabled, onClick, className = "" }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={`shrink-0 whitespace-nowrap pui-lift pui-playful ${disabled ? "" : "active:scale-95"} ${className}`}
      style={{
        borderRadius: `${theme.radius.pill}px`,
        padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
        fontSize: `${theme.typography.caption.size}px`,
        fontWeight: theme.typography.caption.weight,
        background: disabled ? c.background : active ? c.primary : c.surface,
        color: disabled ? c.disabled : active ? c.onAccent : c.textSecondary,
        border: `1px solid ${disabled ? c.border : active ? c.primary : c.border}`,
        transform: active && !disabled ? "translateY(-2px) scale(1.04)" : "translateY(0) scale(1)",
        boxShadow: active && !disabled ? theme.shadows.medium : theme.shadows.low,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {label}
    </button>
  );
}

function ThemedTabs({ items, active, onChange, getLabel = (i) => i, getKey = (i) => i }) {
  const { theme } = useTheme();
  return (
    <div
      className="inline-flex items-center"
      style={{ background: theme.colors.background, borderRadius: `${theme.radius.pill}px`, padding: 3, gap: 2 }}
    >
      {items.map((item) => {
        const key = getKey(item);
        const isActive = key === active;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="pui-lift pui-playful active:scale-95"
            style={{
              borderRadius: `${theme.radius.pill}px`,
              padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
              fontSize: `${theme.typography.caption.size}px`,
              fontWeight: 600,
              background: isActive ? theme.colors.primary : "transparent",
              color: isActive ? theme.colors.onAccent : theme.colors.muted,
              boxShadow: isActive ? `${theme.shadows.medium}, 0 4px 12px ${withAlpha(theme.colors.primary, theme.isDark ? 0.35 : 0.22)}` : "none",
              transform: isActive ? "translateY(-1px)" : "translateY(0)",
            }}
          >
            {getLabel(item)}
          </button>
        );
      })}
    </div>
  );
}

// A themed on/off control — used for Compact Mode / Reduced Motion today,
// and any future boolean setting.
function ThemedSwitch({ checked, onChange, label }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 pui-lift pui-playful active:scale-95"
      style={{
        width: 42,
        height: 24,
        borderRadius: `${theme.radius.pill}px`,
        background: checked ? c.primary : c.border,
        boxShadow: `inset 0 1px 2px ${withAlpha(c.textPrimary, 0.12)}`,
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 rounded-full pui-playful"
        style={{
          width: 20,
          height: 20,
          transform: `translateX(${checked ? 18 : 0}px)`,
          background: "#FFFFFF",
          boxShadow: `0 1px 3px ${withAlpha(c.textPrimary, 0.3)}, 0 1px 1px ${withAlpha(c.textPrimary, 0.15)}`,
        }}
      />
    </button>
  );
}

// Themed variant of BottomSheet's shape, additive alongside the existing
// (unthemed) BottomSheet used throughout the app today — available for
// pages to adopt when they migrate to the design system.
function ThemedSheet({ open, onClose, title, children }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.surfaceText.dialog;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: c.overlay, backdropFilter: "blur(2px)", animation: theme.reducedMotion ? "none" : "pui-fade-in var(--motion-base) ease" }}
        onClick={onClose}
      />
      <div
        className="relative w-full sm:w-96 max-h-[80vh] overflow-y-auto"
        style={{
          // This is the one sheet-shell used as a genuine dialog (it opens
          // stacked on top of Appearance settings), so it sits on the
          // brightest of the new levels — clearly separated from whatever
          // sheet or page is still visible behind it.
          background: theme.isDark
            ? `linear-gradient(180deg, ${lighten(c.dialog, 0.035)}, ${c.dialog})`
            : c.dialog,
          border: `1px solid ${theme.isDark ? withAlpha("#FFFFFF", 0.1) : c.border}`,
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: theme.isDark
            ? `${theme.shadows.floating}, inset 0 1px 0 ${withAlpha("#FFFFFF", 0.08)}`
            : theme.shadows.floating,
          padding: theme.spacing.lg,
          animation: theme.reducedMotion ? "none" : "pui-sheet-up var(--motion-base) cubic-bezier(0.16, 1, 0.3, 1)",
          // Prompt 11A — dialog surface's own auto-contrast, cascading to
          // every Text/Icon/label inside (including custom `children`).
          ...surfaceVars(t),
        }}
      >
        <div
          className="mx-auto sm:hidden"
          style={{ width: 36, height: 4, borderRadius: theme.radius.pill, background: c.border, marginBottom: theme.spacing.md }}
        />
        <div className="flex items-center justify-between" style={{ marginBottom: theme.spacing.md }}>
          <Text variant="title">{title}</Text>
          <button
            onClick={onClose}
            className="pui-press"
            style={{
              padding: theme.spacing.xs,
              borderRadius: theme.radius.pill,
              color: "var(--pui-text-secondary)",
              background: c.background,
              "--pui-depth": "2px",
              "--pui-depth-color": darken(c.background, 0.08),
            }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// A single control that is both a segmented control (labels with a sliding
// highlight that glides between them) and a magnetic drag surface (grab the
// highlight and drag — it continuously snaps to the nearest option instead
// of following the pointer 1:1). Used everywhere the app needs to pick one
// of 3–5 related values: Mode, Interface Style, Font Size, Density.
function SnapSelector({ options, value, onChange, size = "md" }) {
  const { theme } = useTheme();
  const trackRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const activeIndex = Math.max(0, options.findIndex((o) => o.id === value));
  const shownIndex = dragIndex ?? activeIndex;
  const n = options.length;

  const indexFromClientX = useCallback((clientX) => {
    const el = trackRef.current;
    if (!el) return activeIndex;
    const rect = el.getBoundingClientRect();
    const fraction = clamp01((clientX - rect.left) / rect.width);
    return Math.min(n - 1, Math.max(0, Math.round(fraction * (n - 1))));
  }, [activeIndex, n]);

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const idx = indexFromClientX(e.clientX);
    setDragIndex(idx);
  };
  const handlePointerMove = (e) => {
    if (dragIndex === null) return;
    const idx = indexFromClientX(e.clientX);
    if (idx !== dragIndex) setDragIndex(idx);
  };
  const commit = () => {
    if (dragIndex !== null && options[dragIndex] && options[dragIndex].id !== value) {
      onChange(options[dragIndex].id);
    }
    setDragIndex(null);
  };

  const pad = size === "sm" ? 3 : 4;
  const height = size === "sm" ? 34 : 44;

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={commit}
      onPointerCancel={commit}
      className="relative w-full select-none"
      style={{
        display: "flex",
        height,
        padding: pad,
        borderRadius: theme.radius.pill,
        background: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        touchAction: "none",
        cursor: "pointer",
      }}
    >
      {/* Sliding highlight — glides via a CSS transition rather than jumping;
          while actively dragging we shorten the transition so it tracks the
          nearest stop responsively, then it eases in fully on release. */}
      <div
        aria-hidden
        className="absolute"
        style={{
          height: `calc(100% - ${pad * 2}px)`,
          top: pad,
          left: pad,
          width: `calc((100% - ${pad * 2}px) / ${n})`,
          transform: `translateX(calc(${shownIndex} * 100%))`,
          borderRadius: theme.radius.pill,
          background: theme.colors.primary,
          boxShadow: theme.shadows.low,
          transition: theme.reducedMotion ? "none" : `transform ${dragIndex !== null ? "90ms" : "var(--motion-base)"} cubic-bezier(0.34, 1.4, 0.64, 1)`,
        }}
      />
      {options.map((opt, i) => {
        const isActive = i === shownIndex;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => { if (dragIndex === null) onChange(opt.id); }}
            className="relative flex-1 flex items-center justify-center gap-1.5"
            style={{ zIndex: 1, color: isActive ? theme.colors.onAccent : theme.colors.textSecondary, transition: theme.reducedMotion ? "none" : "color var(--motion-fast) ease" }}
          >
            {opt.icon && <opt.icon size={size === "sm" ? 12 : 14} />}
            <Text variant="caption" weight={600} color={isActive ? theme.colors.onAccent : theme.colors.textSecondary}>
              {opt.label}
            </Text>
          </button>
        );
      })}
    </div>
  );
}

// Saturation/Value square + hue strip + hex/RGB fields — a full color-wheel
// style picker so the accent isn't limited to a handful of presets.
function ColorPickerDialog({ open, onClose, value, onChange, title = "Custom Accent Color" }) {
  const { theme } = useTheme();
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const svRef = useRef(null);
  const hueRef = useRef(null);
  const [hexDraft, setHexDraft] = useState(value.toUpperCase());
  const draggingRef = useRef(null);

  useEffect(() => {
    if (open) {
      const next = hexToHsv(value);
      setHsv(next);
      setHexDraft(value.toUpperCase());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitHsv = (next) => {
    setHsv(next);
    const hex = hsvToHex(next.h, next.s, next.v);
    setHexDraft(hex);
    onChange(hex);
  };

  const updateFromSv = (clientX, clientY) => {
    const el = svRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = clamp01((clientX - rect.left) / rect.width);
    const v = clamp01(1 - (clientY - rect.top) / rect.height);
    commitHsv({ ...hsv, s, v });
  };
  const updateFromHue = (clientX) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const h = clamp01((clientX - rect.left) / rect.width) * 360;
    commitHsv({ ...hsv, h });
  };

  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);

  if (!open) return null;
  return (
    <ThemedSheet open={open} onClose={onClose} title={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.md }}>
        <div
          ref={svRef}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); draggingRef.current = "sv"; updateFromSv(e.clientX, e.clientY); }}
          onPointerMove={(e) => { if (draggingRef.current === "sv") updateFromSv(e.clientX, e.clientY); }}
          onPointerUp={() => (draggingRef.current = null)}
          className="relative w-full"
          style={{
            height: 160,
            borderRadius: theme.radius.md,
            touchAction: "none",
            cursor: "crosshair",
            background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))`,
            overflow: "hidden",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: 16, height: 16,
              left: `calc(${hsv.s * 100}% - 8px)`,
              top: `calc(${(1 - hsv.v) * 100}% - 8px)`,
              border: "2px solid white",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.4)",
              background: rgbToHex(rgb.r, rgb.g, rgb.b),
            }}
          />
        </div>

        <div
          ref={hueRef}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); draggingRef.current = "hue"; updateFromHue(e.clientX); }}
          onPointerMove={(e) => { if (draggingRef.current === "hue") updateFromHue(e.clientX); }}
          onPointerUp={() => (draggingRef.current = null)}
          className="relative w-full"
          style={{
            height: 20,
            borderRadius: theme.radius.pill,
            touchAction: "none",
            cursor: "pointer",
            background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
          }}
        >
          <div
            className="absolute top-1/2 rounded-full"
            style={{
              width: 20, height: 20,
              left: `calc(${(hsv.h / 360) * 100}% - 10px)`,
              transform: "translateY(-50%)",
              border: "2px solid white",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.4)",
              background: `hsl(${hsv.h}, 100%, 50%)`,
            }}
          />
        </div>

        <div className="flex items-center" style={{ gap: theme.spacing.sm }}>
          <div className="flex-1">
            <Text variant="caption" color={theme.colors.muted} as="div" style={{ marginBottom: 4 }}>HEX</Text>
            <ThemedInput
              icon={Pipette}
              value={hexDraft}
              onChange={(e) => {
                const v = e.target.value;
                setHexDraft(v);
                if (/^#?[0-9a-fA-F]{6}$/.test(v)) commitHsv(hexToHsv(v.startsWith("#") ? v : `#${v}`));
              }}
            />
          </div>
          <span
            className="shrink-0"
            style={{ width: 40, height: 40, borderRadius: theme.radius.md, background: hexDraft, border: `1px solid ${theme.colors.border}`, marginTop: 18 }}
          />
        </div>

        <div className="grid grid-cols-3" style={{ gap: theme.spacing.sm }}>
          {["r", "g", "b"].map((ch) => (
            <div key={ch}>
              <Text variant="caption" color={theme.colors.muted} as="div" style={{ marginBottom: 4, textTransform: "uppercase" }}>{ch}</Text>
              <ThemedInput
                type="number"
                min={0}
                max={255}
                value={String(rgb[ch])}
                onChange={(e) => {
                  const num = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                  const nextRgb = { ...rgb, [ch]: num };
                  commitHsv(rgbToHsv(nextRgb.r, nextRgb.g, nextRgb.b));
                }}
              />
            </div>
          ))}
        </div>

        <Button variant="primary" fullWidth onClick={onClose}>Done</Button>
      </div>
    </ThemedSheet>
  );
}

/* =========================================================
 * UNIVERSAL ENTITY ID SYSTEM
 * Infrastructure only — not yet wired into any existing engine.
 * Every future entity (notes, folders, flashcards, decks, courses,
 * tasks, events, review sessions, themes, presets, gallery items,
 * workspaces, attachments) will identify itself through this same
 * system, so nothing downstream has to invent its own ID format.
 * =======================================================*/

const ENTITY_TYPES = {
  NOTE: "note",
  FOLDER: "folder",
  FLASHCARD: "flashcard",
  DECK: "deck",
  COURSE: "course",
  TASK: "task",
  EVENT: "event",
  REVIEW_SESSION: "review-session",
  THEME: "theme",
  PRESET: "preset",
  GALLERY_ITEM: "gallery-item",
  WORKSPACE: "workspace",
  ATTACHMENT: "attachment",
};

const ENTITY_TYPE_VALUES = Object.values(ENTITY_TYPES);

// Universal ID generator — every entity across every future engine gets
// its ID from this single function, so IDs are always shaped the same
// way: `<type>_<timestamp36>_<random36>`, e.g. "note_mcx8f2a_7kd9".
function createEntityId(type) {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${type}_${stamp}_${rand}`;
}

// Validates that a value is a well-formed entity id: a string, with at
// least two "_" separators, whose leading segment is a known entity type.
function isValidEntityId(value) {
  if (typeof value !== "string") return false;
  const parts = value.split("_");
  if (parts.length < 3) return false;
  return ENTITY_TYPE_VALUES.includes(parts[0]);
}

// Extracts the entity type prefix from an id, or null if it isn't one
// of ours. Cheap string check — no validation of the full shape.
function getEntityTypeFromId(id) {
  if (typeof id !== "string") return null;
  const type = id.split("_")[0];
  return ENTITY_TYPE_VALUES.includes(type) ? type : null;
}

// Convenience check for "is this id a <type>?" call sites.
function isEntityType(id, type) {
  return getEntityTypeFromId(id) === type;
}

// Typed entity reference shape (documentation only — this file is .jsx,
// so this is a JSDoc typedef rather than a TS type. Not wired into any
// existing state yet.)
/**
 * @typedef {{ id: string, type: string }} EntityRef
 */

// Development-only inspection helper — never used for control flow.
function debugEntityId(id) {
  return {
    id,
    valid: isValidEntityId(id),
    type: getEntityTypeFromId(id),
  };
}

/* ------------------------------------------------------------
   Homepage widget shell system (Phase 1B) — reusable, token-driven
   building blocks for future homepage widgets. Reads exclusively from
   getCardTokens()/getHomeTheme() (Phase 1A), same pattern as the rest
   of this section reading from useTheme(). Nothing on the homepage
   renders through these yet — this is foundation only.
   ------------------------------------------------------------ */

// Shared shell every homepage widget will sit inside. `variant` swaps
// between the default token-driven card look ("default"), a raised
// look that borrows the app's existing high-elevation shadow token
// ("elevated"), and a border-only, no-fill look ("outlined"). Texture
// is intentionally left unrendered — Phase 1A's texture token exists
// as a future hook, not wired to any visual output yet.
function WidgetShell({ children, className = "", onClick, variant = "default" }) {
  const { theme } = useTheme();
  const card = getCardTokens();
  const homeTheme = getHomeTheme();
  const isElevated = variant === "elevated";
  const isOutlined = variant === "outlined";

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`${className}${onClick ? " pui-press cursor-pointer" : ""}`}
      style={{
        borderRadius: card.radius,
        borderWidth: card.borderWidth,
        borderStyle: card.borderStyle,
        borderColor: isOutlined ? homeTheme.border.strong : homeTheme.border.default,
        background: isOutlined ? "transparent" : card.background,
        boxShadow: isOutlined ? "none" : isElevated ? theme.shadows.high : card.shadow,
      }}
    >
      {children}
    </div>
  );
}

// 1×1 square widget — icon, title, optional subtitle, optional badge.
// `icon` takes a component reference (same convention as StatTile/
// ItemCard elsewhere in this file), not a string name.
function ActionCard({ icon: IconCmp, title, subtitle, badge, onClick, variant, className = "" }) {
  const { theme } = useTheme();
  const homeTheme = getHomeTheme();
  return (
    <WidgetShell onClick={onClick} variant={variant} className={`relative aspect-square flex flex-col justify-between p-3.5 ${className}`}>
      <div className="flex items-start justify-between">
        {IconCmp && (
          <span
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{ background: homeTheme.accent.soft, color: homeTheme.accent.primary }}
          >
            <IconCmp size={18} />
          </span>
        )}
        {badge && (
          <span
            className="text-[10px] font-semibold rounded-full px-2 py-0.5"
            style={{ background: homeTheme.accent.soft, color: homeTheme.accent.primary }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-tight truncate" style={{ color: theme.colors.textPrimary }}>
          {title}
        </div>
        {subtitle && (
          <div className="text-xs mt-0.5 leading-tight truncate" style={{ color: theme.colors.textSecondary }}>
            {subtitle}
          </div>
        )}
      </div>
    </WidgetShell>
  );
}

// 1×2 horizontal widget — icon, title, a 1-2 line content area (via
// children), optional badge.
function WideCard({ icon: IconCmp, title, badge, onClick, variant, className = "", children }) {
  const { theme } = useTheme();
  const homeTheme = getHomeTheme();
  return (
    <WidgetShell onClick={onClick} variant={variant} className={`flex items-center gap-3 p-3.5 ${className}`}>
      {IconCmp && (
        <span
          className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
          style={{ background: homeTheme.accent.soft, color: homeTheme.accent.primary }}
        >
          <IconCmp size={20} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold leading-tight truncate" style={{ color: theme.colors.textPrimary }}>
            {title}
          </div>
          {badge && (
            <span
              className="text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0"
              style={{ background: homeTheme.accent.soft, color: homeTheme.accent.primary }}
            >
              {badge}
            </span>
          )}
        </div>
        {children && (
          <div className="text-xs mt-0.5 leading-snug line-clamp-2" style={{ color: theme.colors.textSecondary }}>
            {children}
          </div>
        )}
      </div>
    </WidgetShell>
  );
}

/* ------------------------------------------------------------
   Continue Studying carousel (Phase 1D, corrected). Page 1 is the
   exact same "Continue Studying" card that was already on the
   homepage — same markup, same theme.colors/theme.shadows values,
   nothing about its look changed. Pages 2-4 reuse that identical
   shell shape (same padding/line structure, so all 4 pages are the
   same height) but show an empty state instead of invented subjects,
   since there's no second "continue" item to show yet.

   Swipe + magnetic snap + auto-rotation behavior is unchanged from
   the earlier draft. Still not wired into HomePage in place of the
   old standalone <ContinueCard /> call — flag if you want that now.

   Known simplification: looping from the last page back to the first
   plays as one ordinary backward slide, not a seamless infinite loop
   (that needs cloned edge pages — out of scope for this phase).
   ------------------------------------------------------------ */
function ContinueCardCarousel() {
  const { theme } = useTheme();
  const c = theme.colors;
  const hero = getHeroTokens(); // only the indicator dot colors come from here
  const pageCount = 4;

  const AUTO_ROTATE_MS = 3500;
  const RESUME_DELAY_MS = 4000;
  const SWIPE_THRESHOLD_RATIO = 0.18;
  const AXIS_LOCK_THRESHOLD = 6; // px of movement before we decide swipe vs scroll

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const deltaXRef = useRef(0);
  const widthRef = useRef(0);
  const axisRef = useRef(null); // null | "x" | "y" — decided per-touch, once
  const autoTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);

  // Prompt 1I — standardized timing/easing (matches the app's shared
  // spring curve used elsewhere, e.g. line ~611) instead of a one-off
  // "300ms ease", and now respects the user's reduced-motion setting.
  const hasMotion = !theme.reducedMotion;
  const pageTransition = hasMotion
    ? "transform var(--motion-base, 300ms) cubic-bezier(0.34, 1.56, 0.64, 1)"
    : "none";

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const startAutoTimer = useCallback(() => {
    clearAutoTimer();
    // Reduced motion: leave the carousel on whatever page the user left it
    // on rather than auto-advancing on a timer — manual swipe still works.
    if (theme.reducedMotion) return;
    autoTimerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % pageCount);
    }, AUTO_ROTATE_MS);
  }, [clearAutoTimer, theme.reducedMotion]);

  useEffect(() => {
    if (isDragging) return undefined;
    startAutoTimer();
    return clearAutoTimer;
  }, [activeIndex, isDragging, startAutoTimer, clearAutoTimer]);

  useEffect(() => {
    return () => {
      clearAutoTimer();
      clearResumeTimer();
    };
  }, [clearAutoTimer, clearResumeTimer]);

  const handleTouchStart = (e) => {
    clearResumeTimer();
    axisRef.current = null;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    deltaXRef.current = 0;
    widthRef.current = containerRef.current ? containerRef.current.offsetWidth : 1;
  };

  const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    // Decide once, on the first meaningful movement, whether this touch is
    // a horizontal hero swipe or a vertical page scroll. Combined with
    // touchAction: "pan-y" on the container below, this is what lets
    // vertical scrolling stay smooth/native and never fights the hero.
    if (axisRef.current === null) {
      if (Math.abs(dx) < AXIS_LOCK_THRESHOLD && Math.abs(dy) < AXIS_LOCK_THRESHOLD) return;
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axisRef.current === "x") setIsDragging(true);
    }

    if (axisRef.current !== "x") return; // vertical scroll — let the browser handle it natively

    const width = widthRef.current || 1;
    const proposedPercent = -activeIndex * 100 + (dx / width) * 100;
    const clampedPercent = Math.max(-((pageCount - 1) * 100), Math.min(0, proposedPercent));
    deltaXRef.current = ((clampedPercent - -activeIndex * 100) / 100) * width;

    if (trackRef.current) {
      trackRef.current.style.transition = "none";
      trackRef.current.style.transform = `translateX(${clampedPercent}%)`;
    }
  };

  const handleTouchEnd = () => {
    const wasDraggingX = axisRef.current === "x";
    axisRef.current = null;
    if (!wasDraggingX) return; // was a vertical scroll — nothing to settle

    setIsDragging(false);
    const width = widthRef.current || 1;
    const ratio = deltaXRef.current / width;

    let nextIndex = activeIndex;
    if (ratio <= -SWIPE_THRESHOLD_RATIO) {
      nextIndex = Math.min(activeIndex + 1, pageCount - 1);
    } else if (ratio >= SWIPE_THRESHOLD_RATIO) {
      nextIndex = Math.max(activeIndex - 1, 0);
    }

    if (trackRef.current) {
      trackRef.current.style.transition = "";
    }
    setActiveIndex(nextIndex);
    deltaXRef.current = 0;

    resumeTimerRef.current = setTimeout(() => {
      startAutoTimer();
    }, RESUME_DELAY_MS);
  };

  return (
    <div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        data-hero-carousel
        style={{ touchAction: "pan-y" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          className="flex w-full items-stretch"
          style={{
            transform: `translateX(${-activeIndex * 100}%)`,
            transition: isDragging ? "none" : pageTransition,
          }}
        >
          {Array.from({ length: pageCount }).map((_, i) => {
            const isActive = i === activeIndex;
            return i === 0 ? (
              <div
                key={i}
                className="w-full shrink-0 px-2"
                style={{
                  opacity: isActive ? 1 : 0.55,
                  transform: isActive ? "scale(1)" : "scale(0.96)",
                  transition: hasMotion ? "opacity var(--motion-base, 220ms) ease, transform var(--motion-base, 220ms) ease" : "none",
                }}
              >
                <ContinueCard />
              </div>
            ) : (
              <div
                key={i}
                className="w-full shrink-0 px-2"
                style={{
                  opacity: isActive ? 1 : 0.55,
                  transform: isActive ? "scale(1)" : "scale(0.96)",
                  transition: hasMotion ? "opacity var(--motion-base, 220ms) ease, transform var(--motion-base, 220ms) ease" : "none",
                }}
              >
                <div
                  className="pui-press flex items-center justify-between w-full rounded-[30px] px-5 py-6 text-left"
                  style={chunkyVars(theme, "card", 4)}
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wide leading-tight" style={{ color: c.muted }}>
                      Continue Studying
                    </div>
                    <div className="text-[21px] font-extrabold leading-tight mt-2 truncate" style={{ color: c.muted }}>
                      Nothing else yet
                    </div>
                    <div className="text-sm font-medium leading-tight mt-1" style={{ color: c.textSecondary }}>Start something to see it here</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-2">
        {Array.from({ length: pageCount }).map((_, i) => (
          <span
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === activeIndex ? 16 : 6,
              height: 6,
              background: i === activeIndex ? hero.indicatorActive : hero.indicatorInactive,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PHASE 1B — UNIVERSAL STORAGE REGISTRY
   Infrastructure only — defines the namespaced bucket keys every
   engine (Notes, Themes, Presets, Gallery, Import/Export, and
   whatever comes later) will eventually persist under. No
   localStorage reads/writes happen here yet, and nothing existing
   is wired to it — this is just the shared map of "what buckets
   exist and what are they called."
   ============================================================ */

const STORAGE_VERSION = 1;

const STORAGE_KEYS = {
  APP: "plug.app",
  NOTES: "plug.notes",
  FOLDERS: "plug.folders",
  FLASHCARDS: "plug.flashcards",
  BOOKMARKS: "plug.bookmarks",
  PLANNER: "plug.planner",
  TASKS: "plug.tasks",
  COURSES: "plug.courses",
  SUBJECTS: "plug.subjects",
  QUIZZES: "plug.quizzes",
  PROGRESS: "plug.progress",
  ANALYTICS: "plug.analytics",
  SEARCH: "plug.search",
  SETTINGS: "plug.settings",
  CUSTOMIZATION: "plug.customization",
  THEMES: "plug.themes",
  PRESETS: "plug.presets",
  GALLERY: "plug.gallery",
  PLUGINS: "plug.plugins",
  SYNC: "plug.sync",
  CACHE: "plug.cache",
};

const STORAGE_BUCKETS = Object.values(STORAGE_KEYS);

// Validates that a value is one of the known namespaced storage keys.
function isValidStorageKey(key) {
  return typeof key === "string" && STORAGE_BUCKETS.includes(key);
}

// Looks up a storage key by its registry name (e.g. "NOTES" -> "plug.notes").
// Returns null if the name isn't a known bucket.
function getStorageKey(name) {
  if (typeof name !== "string") return null;
  return Object.prototype.hasOwnProperty.call(STORAGE_KEYS, name) ? STORAGE_KEYS[name] : null;
}

// Development-only inspection helper — never used for control flow.
function debugStorageKey(key) {
  return {
    key,
    valid: isValidStorageKey(key),
    version: STORAGE_VERSION,
  };
}

/* ============================================================
   HOMEPAGE THEME TOKEN FOUNDATION (PHASE 1A)
   ============================================================ */

// Foundation only — no component reads these yet, and nothing about the
// homepage's current appearance or behavior changes when this lands.
// Values match the app's existing dark/green visual language (see
// NEUTRALS_DARK and ACCENT_PALETTES.green above) rather than inventing a
// new palette. A future phase will migrate homepage components onto these
// tokens; this phase just establishes them.

const MODERN_THEME = {
  meta: {
    id: "modern",
    label: "Modern",
  },
  surface: {
    base: "#0B0F14",
    secondary: "#141B23",
    elevated: "#1B2531",
  },
  accent: {
    primary: "#58CC02",
    soft: "rgba(88,204,2,0.16)",
    contrast: "#FFFFFF",
  },
  border: {
    default: "#28323F",
    strong: "#344356",
  },
  card: {
    radius: 16,
    borderWidth: 1,
    borderStyle: "solid",
    background: "#1B2531",
    shadow: "0 4px 14px rgba(0,0,0,0.08)",
    texture: "none",
  },
  button: {
    radius: 999,
    fill: "#58CC02",
    text: "#FFFFFF",
    border: "transparent",
  },
  hero: {
    radius: 22,
    background: "linear-gradient(135deg, #1B2531, #141B23)",
    border: "#28323F",
    indicatorActive: "#58CC02",
    indicatorInactive: "#344356",
  },
  texture: {
    enabled: false,
    type: "none",
    opacity: 0,
  },
  motion: {
    enabled: true,
    durationMs: 180,
    easing: "ease",
  },
};

const ACTIVE_HOME_THEME = MODERN_THEME;

function getHomeTheme() {
  return ACTIVE_HOME_THEME;
}
function getCardTokens() {
  return ACTIVE_HOME_THEME.card;
}
function getHeroTokens() {
  return ACTIVE_HOME_THEME.hero;
}
function getButtonTokens() {
  return ACTIVE_HOME_THEME.button;
}

/* ============================================================
   SECTION 1 — CONFIG / REGISTRIES
   Everything the app needs comes from these tables. No widget-
   specific rendering branches, no hardcoded per-shape switches.
   Adding a new widget type, size, or shape means editing a table
   here — nothing else downstream needs to change.
   ============================================================ */

const COLUMNS = 2;
const ROWS = 4;                     // fixed — Home is always a 2x4 board
const TOTAL_SLOTS = COLUMNS * ROWS; // 8, never more, never fewer
const CELL_H = 122;                 // px height of one grid row — back to a comfortable size; shrinking this squeezed each card's own content, which wasn't the ask
const GAP = 18;                     // px gap between cells — this is the actual "space between buttons" that needed to grow
const LONG_PRESS_MS = 500;
const MOVE_CANCEL_PX = 12;
const GUTTER_W = 72;                // px width of the persistent left rail

// The app's legacy single accent, still read by every page that hasn't
// migrated to the theme system yet (see Section 0). New/migrated
// components should use useTheme().colors.primary instead, which reflects
// the user's actual Accent Color setting; this constant intentionally
// stays fixed so it keeps working as a stable fallback for unmigrated
// pages until they're redesigned in a later phase.
const ACCENT = "#0F6B5C";

const SIZE_DIMS = {
  "1x1": { w: 1, h: 1 },
  "2x1": { w: 2, h: 1 },
};
const ALL_SIZES = Object.keys(SIZE_DIMS);

// A widget's "shape" is only the card's corner silhouette — never a
// clip-path or a literal circle/stadium. Values are capped px radii so a
// near-square 1x1 cell can never become a literal circle/ellipse the way
// borderRadius: "50%" or "999px" would produce; on a wide 2x1 card the
// higher-radius options still read as "pill-like" without ever breaking
// the rectangular card silhouette.
const SHAPE_STYLES = {
  compact: { borderRadius: 10 }, // Compact Card — tightest, but the thick chunky border keeps it from reading as sharp
  soft: { borderRadius: 16 },    // Soft Rectangle
  rounded: { borderRadius: 22 }, // Rounded Card
  pill: { borderRadius: 30 },    // Pill Card
};
const ALL_SHAPES = Object.keys(SHAPE_STYLES);

const WIDGET_REGISTRY = [
  // --- existing, functional widgets — label/content unchanged (still used
  // by the placed-widget tile rendering); category/title/description/icon
  // added for the new catalogue only.
  // Note: "calendar" isn't in any of the four example category lists from
  // the spec — assigned to Study as the closest fit (schedule/planning).
  // Flag if it should sit elsewhere.
  { type: "flashcards", label: "Flashcards", content: "123 Due", allowedSizes: ALL_SIZES,
    category: "review", title: "Flashcards", description: "Review cards due today", icon: Copy },
  { type: "subjects", label: "Subjects", content: "8 Subjects", allowedSizes: ALL_SIZES,
    category: "study", title: "Subjects", description: "Browse your subjects", icon: FolderTree },
  { type: "progress", label: "Progress", content: "67%", allowedSizes: ALL_SIZES,
    category: "progress", title: "Progress", description: "Track overall progress", icon: TrendingUp },
  { type: "calendar", label: "Calendar", content: "Today's Tasks", allowedSizes: ALL_SIZES,
    category: "study", title: "Calendar", description: "See today's tasks", icon: Clock },
  { type: "dailyFact", label: "Daily Fact", content: "Did you know...", allowedSizes: ["2x1"],
    category: "discover", title: "Daily Fact", description: "A new fact each day", icon: Info },
  { type: "dailyDefinition", label: "Daily Definition", content: "Term of the day", allowedSizes: ["2x1"],
    category: "discover", title: "Daily Definition", description: "A new term each day", icon: BookOpen },

  // --- catalogue placeholders — not functional yet. Selecting one still
  // continues through the real Shape/Size picker and can be placed on the
  // board; content is an honest "Coming soon" rather than fake data.
  { type: "notes", label: "Notes", content: "Coming soon", allowedSizes: ALL_SIZES,
    category: "study", title: "Notes", description: "Jump into your notes", icon: StickyNote },
  { type: "courses", label: "Courses", content: "Coming soon", allowedSizes: ALL_SIZES,
    category: "study", title: "Courses", description: "Browse your courses", icon: GraduationCap },
  { type: "resources", label: "Resources", content: "Coming soon", allowedSizes: ALL_SIZES,
    category: "study", title: "Resources", description: "Shared course materials", icon: Paperclip },
  { type: "library", label: "Library", content: "Coming soon", allowedSizes: ALL_SIZES,
    category: "study", title: "Library", description: "Your saved materials", icon: Archive },

  { type: "quiz", label: "Quiz", content: "Coming soon", allowedSizes: ALL_SIZES,
    category: "review", title: "Quiz", description: "Test yourself", icon: CheckSquare },
  { type: "practice", label: "Practice", content: "Coming soon", allowedSizes: ALL_SIZES,
    category: "review", title: "Practice", description: "Targeted practice sets", icon: Target },
  { type: "warmup", label: "Warm-up", content: "Coming soon", allowedSizes: ["2x1"],
    category: "review", title: "Warm-up", description: "A quick review warm-up", icon: Zap },

  { type: "analytics", label: "Analytics", content: "Coming soon", allowedSizes: ALL_SIZES,
    category: "progress", title: "Analytics", description: "Deeper progress breakdowns", icon: BarChart3 },
  { type: "streak", label: "Streak", content: "Coming soon", allowedSizes: ["2x1"],
    category: "progress", title: "Streak", description: "Your current streak", icon: Flame },
  { type: "achievements", label: "Achievements", content: "Coming soon", allowedSizes: ALL_SIZES,
    category: "progress", title: "Achievements", description: "Badges you've earned", icon: Award },

  { type: "dailyElement", label: "Daily Element", content: "Coming soon", allowedSizes: ["2x1"],
    category: "discover", title: "Daily Element", description: "A new element each day", icon: Sparkles },
  { type: "randomTopic", label: "Random Topic", content: "Coming soon", allowedSizes: ["2x1"],
    category: "discover", title: "Random Topic", description: "Something new to explore", icon: Globe },
];

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Layers },
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "study", label: "Study", icon: Bookmark },
  { id: "review", label: "Review", icon: BookOpen },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "saved", label: "Saved", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
  // Prompt 10.3 — its own top-level destination (not a Settings sub-page),
  // so it sits in the primary nav right below Settings. The nav label
  // stays "Customization"; the page itself keeps the "Themes" title (see
  // getNavLabel's override below).
  { id: "customization", label: "Customization", icon: Palette },
];

function getWidgetDef(type) {
  return WIDGET_REGISTRY.find((d) => d.type === type);
}

function shapeStyle(shape) {
  return SHAPE_STYLES[shape] || SHAPE_STYLES.rounded;
}

function getNavLabel(screen) {
  if (screen === "profile") return "Profile";
  if (screen === "customization") return "Themes";
  return NAV_ITEMS.find((n) => n.id === screen)?.label || "Home";
}

/* ============================================================
   SECTION 1B — GLOBAL SEARCH INDEX
   One flat table, grouped at declaration time. Adding a new
   searchable page/category later means adding one row here —
   nothing about the search UI or filtering logic changes.
   ============================================================ */

const SEARCH_GROUPS = [
  { group: "Courses", icon: GraduationCap, items: ["Pharmacology", "Anatomy & Physiology", "Biochemistry", "Microbiology"] },
  { group: "Subjects", icon: BookOpen, items: ["Cardiology", "Endocrinology", "Neurology"] },
  { group: "Topics", icon: Layers, items: ["Drug Mechanisms", "Cranial Nerves", "Krebs Cycle"] },
  { group: "Lessons", icon: Play, items: ["Beta Blockers", "Cranial Nerve Mnemonics", "ATP Synthesis"] },
  { group: "Notes", icon: FileText, items: ["Beta blockers — mechanism", "Cranial nerve mnemonics", "Krebs cycle summary"] },
  { group: "Folders", icon: Folder, items: ["Pharmacology", "Anatomy", "Biochemistry"] },
  { group: "Flashcard Decks", icon: Bookmark, items: ["Cardiology", "Pharmacology", "Anatomy", "Biochemistry"] },
  { group: "Flashcards", icon: Bookmark, items: ["Autonomic Nervous System", "Beta-1 vs Beta-2 receptors", "Cranial Nerve III"] },
  { group: "Quiz Sets", icon: HelpCircle, items: ["Pharmacology Midterm", "Cardiology Basics"] },
  { group: "Review Sessions", icon: Clock, items: ["Today, 8:40 AM · Pharmacology", "Yesterday, 6:15 PM · Cardiology"] },
  { group: "Saved Topics", icon: Star, items: ["Drug Mechanisms", "Cranial Nerves"] },
  { group: "Saved Flashcards", icon: Star, items: ["Autonomic Nervous System"] },
  { group: "Bookmarks", icon: Bookmark, items: ["Krebs Cycle Summary"] },
  { group: "Progress", icon: BarChart3, items: ["Overall Progress", "Study Streak", "By Subject"] },
  { group: "Settings", icon: Settings, items: ["Notifications", "Daily Goal"] },
  { group: "Customization", icon: Palette, items: ["Themes"] },
  { group: "Profile", icon: User, items: ["Learner Name", "Achievements", "Stats"] },
];

const SEARCH_INDEX = SEARCH_GROUPS.flatMap(({ group, icon, items }) =>
  items.map((label, i) => ({ id: `${group}-${i}`, group, icon, label }))
);

// Which screen a given search group should land on. Several groups don't
// have a dedicated page yet (Quiz Sets, Saved *, Bookmarks) — they route to
// the closest existing surface until those pages exist; nothing else about
// search needs to change when they do.
const GROUP_SCREEN_MAP = {
  Courses: "courses", Subjects: "courses", Topics: "courses", Lessons: "courses",
  Notes: "notes", Folders: "notes", Bookmarks: "notes",
  "Flashcard Decks": "study", Flashcards: "study", "Saved Flashcards": "study",
  "Quiz Sets": "study",
  "Review Sessions": "review", "Saved Topics": "review",
  Progress: "progress",
  Settings: "settings",
  Customization: "customization",
  Profile: "profile",
};

const RECENT_SEARCHES = ["Pharmacology", "Flashcards", "Notes"];

const RECENT_PAGES = [
  { label: "Cardiology", group: "Subjects", icon: BookOpen },
  { label: "Drug Mechanisms", group: "Notes", icon: FileText },
  { label: "Autonomic Nervous System", group: "Flashcards", icon: Bookmark },
];

/* ============================================================
   SECTION 2 — GRID ENGINE
   Pure functions, no React. This is the whole "can this widget
   legally go here" model. Nothing in here knows about pointers,
   rendering, or components, so it's the one part of the app that
   could be reused (or unit tested) completely on its own.
   ============================================================ */

function dims(size) { return SIZE_DIMS[size]; }

function cellsFor(row, col, w, h) {
  const out = [];
  for (let r = row; r < row + h; r++) for (let c = col; c < col + w; c++) out.push(`${r}-${c}`);
  return out;
}

function buildOccupancy(widgets, excludeId) {
  const occ = {};
  widgets.forEach((wd) => {
    if (wd.id === excludeId) return;
    const { w, h } = dims(wd.size);
    cellsFor(wd.row, wd.col, w, h).forEach((k) => { occ[k] = wd.id; });
  });
  return occ;
}

function getOccupants(widgets, row, col, w, h, excludeId) {
  if (row < 0 || col < 0 || col + w > COLUMNS || row + h > ROWS) {
    return { inBounds: false, occupants: new Set() };
  }
  const occ = buildOccupancy(widgets, excludeId);
  const occupants = new Set();
  cellsFor(row, col, w, h).forEach((k) => { if (occ[k]) occupants.add(occ[k]); });
  return { inBounds: true, occupants };
}

// Can widget `id` (size w x h) legally sit at row/col? Empty space is always
// fine; a single same-size widget already there counts as a valid SWAP target.
// Row/col are clamped to the fixed board first, so the only way this reports
// "invalid" is a real conflict — never an out-of-bounds coordinate.
function checkPlacement(widgets, id, w, h, row, col) {
  let c = w === COLUMNS ? 0 : Math.max(0, Math.min(COLUMNS - w, col));
  let r = Math.max(0, Math.min(ROWS - h, row));
  const { inBounds, occupants } = getOccupants(widgets, r, c, w, h, id);
  if (!inBounds) return { ok: false, row: r, col: c };
  if (occupants.size === 0) return { ok: true, row: r, col: c };
  if (occupants.size === 1) {
    const otherId = [...occupants][0];
    const other = widgets.find((x) => x.id === otherId);
    const self = widgets.find((x) => x.id === id);
    if (other && self && other.size === self.size) return { ok: true, row: r, col: c, swapWith: otherId };
  }
  return { ok: false, row: r, col: c };
}

// find nearest free slot for a NEW or RESIZED widget, scanning top-to-bottom.
// Returns null if the board genuinely has no room for this footprint —
// the board never grows to accommodate it.
function findPlacement(widgets, desiredRow, w, h, excludeId) {
  for (let r = Math.max(0, desiredRow); r <= ROWS - h; r++) {
    for (let c = 0; c <= COLUMNS - w; c++) {
      const { occupants } = getOccupants(widgets, r, c, w, h, excludeId);
      if (occupants.size === 0) return { row: r, col: c };
    }
  }
  // didn't find room scanning from desiredRow downward — try the whole board
  for (let r = 0; r <= ROWS - h; r++) {
    for (let c = 0; c <= COLUMNS - w; c++) {
      const { occupants } = getOccupants(widgets, r, c, w, h, excludeId);
      if (occupants.size === 0) return { row: r, col: c };
    }
  }
  return null;
}

function slotsUsed(widgets) {
  return widgets.reduce((sum, wd) => {
    const { w, h } = dims(wd.size);
    return sum + w * h;
  }, 0);
}

// Pure positioning — depends only on module constants, so it lives outside
// any component and never needs to be recreated on render. Places an item
// on the CSS grid by line numbers (1-indexed) instead of computing a
// percentage left/width by hand, so column widths always come from the
// grid track sizing and can never add up to more than 100%.
function gridSpan(row, col, w, h) {
  return {
    gridColumn: `${col + 1} / span ${w}`,
    gridRow: `${row + 1} / span ${h}`,
  };
}

/* ============================================================
   SECTION 3 — BOARD STATE (the reusable "engine")
   Everything about owning widgets, edit mode, and drag/drop lives
   here. Home is just a consumer of this hook. Any future screen
   that needs its own board (or a future rewrite of Home) can use
   this hook without touching the rest of the app.
   ============================================================ */

function useWidgetBoard() {
  const [widgets, setWidgets] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [resizeMenuFor, setResizeMenuFor] = useState(null);
  const [drag, setDrag] = useState(null); // {id,x,y,offsetX,offsetY,w,h,boxW,boxH,hoverRow,hoverCol,ok}

  const idCounter = useRef(1);
  const gridRef = useRef(null);
  const longPressTimer = useRef(null);
  const pressOrigin = useRef({ x: 0, y: 0 });
  const cancelledPress = useRef(false);

  const startDrag = useCallback((e, widget) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const gridRect = gridRef.current.getBoundingClientRect();
    const { w, h } = dims(widget.size);
    setDrag({
      id: widget.id,
      w, h,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      x: e.clientX,
      y: e.clientY,
      boxW: (w / COLUMNS) * gridRect.width - GAP,
      boxH: h * CELL_H + (h - 1) * GAP - GAP,
      hoverRow: widget.row,
      hoverCol: widget.col,
      ok: true,
    });
  }, []);

  const handlePointerDown = (e, widget) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    cancelledPress.current = false;
    pressOrigin.current = { x: e.clientX, y: e.clientY };

    if (editMode) {
      startDrag(e, widget);
      return;
    }
    longPressTimer.current = setTimeout(() => {
      if (cancelledPress.current) return;
      setEditMode(true);
      startDrag(e, widget);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e, widget) => {
    if (drag && drag.id === widget.id) {
      const gridRect = gridRef.current.getBoundingClientRect();
      const relX = e.clientX - gridRect.left;
      const relY = e.clientY - gridRect.top - drag.offsetY + CELL_H / 2 + GAP / 2;
      let col = relX < gridRect.width / 2 ? 0 : 1;
      let row = Math.max(0, Math.floor(relY / (CELL_H + GAP)));
      const res = checkPlacement(widgets, widget.id, drag.w, drag.h, row, col);
      setDrag((prev) => prev && ({
        ...prev, x: e.clientX, y: e.clientY,
        hoverRow: res.row, hoverCol: res.col, ok: res.ok,
      }));
      return;
    }
    // still waiting on long-press timer — cancel if finger wandered (scroll intent)
    const dx = e.clientX - pressOrigin.current.x;
    const dy = e.clientY - pressOrigin.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      cancelledPress.current = true;
    }
  };

  const handlePointerUp = (e, widget) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}

    if (drag && drag.id === widget.id) {
      const res = checkPlacement(widgets, widget.id, drag.w, drag.h, drag.hoverRow, drag.hoverCol);
      if (res.ok) {
        setWidgets((prev) => prev.map((wd) => {
          if (wd.id === widget.id) return { ...wd, row: res.row, col: res.col };
          if (res.swapWith && wd.id === res.swapWith) return { ...wd, row: widget.row, col: widget.col };
          return wd;
        }));
      }
      setDrag(null);
    }
  };

  const deleteWidget = (id) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setResizeMenuFor(null);
  };

  const resizeWidget = (id, newSize) => {
    setWidgets((prev) => {
      const widget = prev.find((w) => w.id === id);
      if (!widget) return prev;
      const { w, h } = dims(newSize);
      const fit = checkPlacement(prev, id, w, h, widget.row, widget.col);
      if (fit.ok) {
        return prev.map((wd) => wd.id === id ? { ...wd, size: newSize, row: fit.row, col: fit.col } : wd);
      }
      const spot = findPlacement(prev, widget.row, w, h, id);
      if (!spot) return prev; // no room on the board — leave the widget as-is
      return prev.map((wd) => wd.id === id ? { ...wd, size: newSize, row: spot.row, col: spot.col } : wd);
    });
    setResizeMenuFor(null);
  };

  // Returns { id } on success, null if the board has no room for this footprint.
  const addWidget = (type, shape, size, desiredRow) => {
    const { w, h } = dims(size);
    const spot = findPlacement(widgets, desiredRow, w, h, null);
    if (!spot) return null;
    const id = `w-${idCounter.current++}`;
    setWidgets((prev) => [...prev, { id, type, shape, size, row: spot.row, col: spot.col }]);
    return { id };
  };

  const toggleResizeMenu = (id) => setResizeMenuFor((cur) => (cur === id ? null : id));

  const exitEditMode = () => {
    setEditMode(false);
    setResizeMenuFor(null);
  };

  return {
    widgets, editMode, resizeMenuFor, drag, gridRef,
    handlePointerDown, handlePointerMove, handlePointerUp,
    deleteWidget, resizeWidget, addWidget, toggleResizeMenu, exitEditMode,
  };
}

/* ============================================================
   SECTION 4 — LEAF COMPONENTS
   ============================================================ */

// Shared shell for the widget picker and the FAB's create sheet —
// both were the same bottom-sheet markup duplicated verbatim before.
function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    const { body } = document;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}

/* ------------------------------------------------------------
   Widget quick menu (Phase 1E). A lightweight launcher shown when a
   homepage widget placeholder is tapped — NOT the widgets themselves,
   and separate from the existing WidgetPicker (that's still the
   unrelated flow for choosing a widget's type/shape/size when
   building the board; this component doesn't touch it or its
   trigger). Reuses the app's existing overlay conventions — same
   c.overlay/blur backdrop and pui-fade-in used by BottomSheet below,
   plus the existing pui-pop-in fade+scale keyframe — rather than
   introducing new visual language. Selecting a category currently
   only closes the popup; no destination pages exist yet.
   ------------------------------------------------------------ */
const WIDGET_QUICK_MENU_CATEGORIES = [
  { id: "study", label: "Study", icon: BookOpen },
  { id: "review", label: "Review", icon: Layers },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "discover", label: "Discover", icon: Search },
];

function WidgetQuickMenu({ open, onClose, onSelect = () => {} }) {
  const { theme } = useTheme();
  const c = theme.colors;
  useBodyScrollLock(open);
  if (!open) return null;

  const handleSelect = (id) => {
    onSelect(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="absolute inset-0"
        style={{
          background: c.overlay,
          backdropFilter: "blur(2px)",
          animation: theme.reducedMotion ? "none" : "pui-fade-in var(--motion-base) ease",
        }}
        onClick={onClose}
      />
      <div
        className="relative w-full sm:w-80 rounded-2xl p-4"
        style={{
          background: c.sheet,
          border: `1px solid ${c.border}`,
          boxShadow: theme.shadows.floating,
          animation: theme.reducedMotion ? "none" : "pui-pop-in var(--motion-base) cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="grid grid-cols-2 gap-2.5">
          {WIDGET_QUICK_MENU_CATEGORIES.map(({ id, label, icon: IconCmp }) => (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className="flex flex-col items-center justify-center gap-2 rounded-xl py-5 pui-lift active:scale-[0.97] transition-all duration-150"
              style={{ border: `1px solid ${c.border}`, background: c.card }}
            >
              <span
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{ background: withAlpha(c.primary, 0.14), color: c.primary }}
              >
                <IconCmp size={20} />
              </span>
              <span className="text-sm font-medium" style={{ color: c.textPrimary }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BottomSheet({ open, onClose, title, children }) {
  const { theme } = useTheme();
  const c = theme.colors;
  useBodyScrollLock(open);
  if (!open) return null;
  // Same subtle "molded surface" treatment as Card/ItemCard: a faint top
  // gradient plus a soft inset highlight along the top edge, so every
  // sheet/dialog/context-menu (they all render through this one shell)
  // reads as gently lit rather than a flat panel.
  // Sheets now live one level brighter than `surface` (their own `sheet`
  // token) so a bottom sheet reading over a page clearly separates from
  // whatever surface sits behind it, instead of nearly matching it.
  const sheetFace = theme.isDark
    ? `linear-gradient(180deg, ${lighten(c.sheet, 0.03)}, ${c.sheet})`
    : `linear-gradient(180deg, ${lighten(c.sheet, 0.015)}, ${c.sheet})`;
  const sheetGlow = theme.isDark
    ? `inset 0 1px 0 ${withAlpha("#FFFFFF", 0.07)}`
    : `inset 0 1px 0 ${withAlpha("#FFFFFF", 0.6)}`;
  const t = theme.surfaceText.sheet;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0"
        style={{
          background: c.overlay,
          backdropFilter: "blur(2px)",
          overscrollBehavior: "contain",
          touchAction: "none",
          animation: theme.reducedMotion ? "none" : "pui-fade-in var(--motion-base) ease",
        }}
        onClick={onClose}
      />
      <div
        className="relative w-full sm:w-96 flex flex-col pui-sheet-max-h"
        style={{
          background: sheetFace,
          border: `1px solid ${c.border}`,
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: `${theme.shadows.floating}, ${sheetGlow}`,
          animation: theme.reducedMotion ? "none" : "pui-sheet-up var(--motion-base) cubic-bezier(0.16, 1, 0.3, 1)",
          // Prompt 11A — every title, label, and body Text rendered inside
          // this sheet (including whatever a caller passes as `children`)
          // now automatically follows the sheet surface's own contrast.
          ...surfaceVars(t),
        }}
      >
        <div className="shrink-0" style={{ padding: `${theme.spacing.lg}px ${theme.spacing.lg}px 0` }}>
          <div
            className="mx-auto sm:hidden"
            style={{ width: 36, height: 4, borderRadius: theme.radius.pill, background: c.border, marginBottom: theme.spacing.md }}
          />
          <div className="flex items-center justify-between" style={{ marginBottom: theme.spacing.md }}>
            <Text variant="title">{title}</Text>
            <button
              onClick={onClose}
              className="pui-press"
              style={{
                padding: theme.spacing.xs,
                borderRadius: theme.radius.pill,
                color: "var(--pui-text-secondary)",
                background: c.background,
                "--pui-depth": "2px",
                "--pui-depth-color": darken(c.background, 0.08),
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div
          className="flex-1 overflow-y-auto overscroll-contain pui-scroll"
          style={{
            minHeight: 0,
            padding: `0 ${theme.spacing.lg}px`,
            paddingBottom: `max(${theme.spacing.lg}px, env(safe-area-inset-bottom, 0px))`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Section 13 — Confirmation Dialogs: only for destructive/irreversible
// actions (Delete Course, Delete Note, Reset Appearance, ...) — never for
// navigation, search, theme switching, or plain toggles, which all stay
// single-tap. Reuses BottomSheet's own rise-from-bottom/fade-background
// shell so it never has to redefine those mechanics, and fires a heavy
// haptic the moment it opens (the same "this matters" cue a native iOS
// destructive-action sheet gives).
function ConfirmSheet({ open, onClose, onConfirm, title, message, confirmLabel = "Delete" }) {
  const { theme } = useTheme();
  const firedHaptic = useRef(false);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (open && !firedHaptic.current) {
      triggerHaptic("heavy", theme.reducedMotion);
      firedHaptic.current = true;
    }
    if (!open) { firedHaptic.current = false; setConfirming(false); }
  }, [open, theme.reducedMotion]);
  if (!open) return null;
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <Text variant="body" color="var(--pui-text-secondary)">{message}</Text>
      <div className="flex items-center gap-2" style={{ marginTop: theme.spacing.lg }}>
        <Button variant="secondary" fullWidth onClick={onClose} disabled={confirming}>Cancel</Button>
        <Button
          variant="destructive"
          fullWidth
          loading={confirming}
          onClick={() => {
            setConfirming(true);
            setTimeout(() => { onConfirm(); onClose(); }, 420);
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </BottomSheet>
  );
}

// Purely visual: what a widget looks like, given its registry entry and
// cosmetic shape. Used both for the widget sitting in the grid and for the
// floating clone that follows the finger while dragging — this markup is
// not duplicated in both places.
//
// Universal homepage widget renderer (Prompt 1K full rebuild — supersedes
// the 1H/1J versions). Every homepage widget renders through this one
// component; only data (icon/label/content/value/badge/progress/button)
// differs per widget, and each slot is hidden automatically when absent.
// shapeStyle(shape) is a pure card-corner-radius silhouette (Rounded/Soft/
// Pill/Compact, all in the 16-26px "never sharp" range) — never a clip-path
// or a literal circle; see SHAPE_STYLES above.
function Widget({ def, shape, size, jiggle, value, badge, progress, button, showAction, footer }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const IconCmp = def.icon;
  const hasProgress = typeof progress === "number";
  // "button" is the current name for the bottom action slot; "footer" and
  // the old boolean "showAction" still work so nothing already passing
  // them breaks.
  const actionLabel = button || footer || null;
  const hasAction = !!actionLabel || !!showAction;
  const isWide = size === "2x1";

  // Icon badge — solid saturated fill (not a translucent tint) with a
  // white icon, matching the app icon-holder look of the rest of the
  // chunky system, instead of the previous soft-ghost-of-the-color style.
  const iconBadge = IconCmp && (
    <span
      className={`flex items-center justify-center rounded-2xl shrink-0 ${isWide ? "w-10 h-10" : "w-9 h-9"}`}
      style={{ background: c.primary, color: c.onAccent, boxShadow: `0 2px 0 ${darken(c.primary, 0.2)}` }}
    >
      <IconCmp size={isWide ? 18 : 16} />
    </span>
  );

  const badgeChip = badge != null && badge !== "" && (
    <span
      className="text-[9px] font-bold rounded-full px-1.5 py-0.5 shrink-0"
      style={{ background: c.primary, color: c.onAccent }}
    >
      {badge}
    </span>
  );

  const progressBar = hasProgress && (
    <div className="h-1.5 w-full rounded-full overflow-hidden mt-1.5" style={{ background: withAlpha(c.primary, 0.16) }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%`, background: c.primary }}
      />
    </div>
  );

  const actionRow = hasAction && (
    <div className="flex items-center gap-1" style={{ color: c.primary }}>
      {actionLabel && <span className="text-[10px] font-bold">{actionLabel}</span>}
      <ChevronRight size={13} />
    </div>
  );

  return (
    <div
      className={`pui-press absolute inset-0 flex ${isWide ? "flex-row items-center gap-3 px-3" : "flex-col items-center justify-center text-center px-2.5"} py-2.5 ${jiggle ? "jiggle" : ""}`}
      style={{
        ...chunkyVars(theme, "card", 4),
        ...shapeStyle(shape),
      }}
    >
      {isWide ? (
        // 2x1 — recomposed, not a stretched square: icon on the left, a
        // text stack in the middle, and value/action given real room on
        // the right instead of everything just spreading out thinner.
        <>
          {iconBadge}
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className="text-[12px] font-semibold leading-tight truncate" style={{ color: c.textPrimary }}>
                {def.label}
              </div>
              {badgeChip}
            </div>
            {def.content && (
              <div className="text-[10.5px] leading-tight truncate" style={{ color: c.textSecondary }}>
                {def.content}
              </div>
            )}
            {progressBar}
          </div>
          {(value != null || hasAction) && (
            <div className="shrink-0 flex flex-col items-end justify-center gap-1">
              {value != null && (
                <div className="text-[16px] font-bold leading-none" style={{ color: c.textPrimary }}>
                  {value}
                </div>
              )}
              {actionRow}
            </div>
          )}
        </>
      ) : (
        // 1x1 — centered and compact, closer to a tappable button than a
        // mini dashboard card, since the tile itself is small now. Badge
        // overlays the icon's corner instead of taking its own row.
        <>
          <div className="relative shrink-0">
            {iconBadge}
            {badgeChip && <span className="absolute -top-1.5 -right-1.5">{badgeChip}</span>}
          </div>

          <div className="min-w-0 mt-1.5">
            <div className="text-[12.5px] font-semibold leading-tight truncate" style={{ color: c.textPrimary }}>
              {def.label}
            </div>
            {value != null && (
              <div className="text-[15px] font-bold leading-tight mt-0.5 truncate" style={{ color: c.textPrimary }}>
                {value}
              </div>
            )}
            {def.content && (
              <div className="text-[9.5px] leading-tight mt-0.5 truncate" style={{ color: c.textSecondary }}>
                {def.content}
              </div>
            )}
          </div>

          {progressBar}
          {hasAction && <div className="mt-1">{actionRow}</div>}
        </>
      )}
    </div>
  );
}
// The delete/resize affordances that appear over a widget in edit mode.
// Rendered as a sibling of Widget rather than nested inside its shaped box
// so they're never clipped by the card's own rounded corners.
// CornerButton: delete and resize-toggle previously duplicated the same
// circular-button markup (size, colors, shadow, stop-propagation guard),
// differing only in which corner they sit in, their icon, and their handler.
function CornerButton({ side, icon: IconCmp, onClick }) {
  const { theme } = useTheme();
  const c = theme.colors;
  // Always a solid, theme-inverse chip (dark surface in light mode, light
  // surface in dark mode) so the icon keeps guaranteed contrast against its
  // own background regardless of what's underneath — never relies on
  // opacity or on the page's own light/dark surface color.
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`absolute -top-2 ${side === "right" ? "-right-2" : "-left-2"} rounded-full p-1 z-10 active:scale-90 transition-transform duration-150`}
      style={{ background: c.textPrimary, color: c.background, boxShadow: theme.shadows.medium }}
    >
      <IconCmp size={12} />
    </button>
  );
}

function EditOverlay({ onDelete, allowedSizes, currentSize, resizeMenuOpen, onToggleResize, onPickSize }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <>
      <CornerButton side="right" icon={X} onClick={onDelete} />
      {allowedSizes.length > 1 && (
        <CornerButton side="left" icon={Maximize2} onClick={onToggleResize} />
      )}
      {resizeMenuOpen && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 rounded-xl p-1 flex gap-1 z-20"
          style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: theme.shadows.high }}
        >
          {allowedSizes.map((s) => (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); onPickSize(s); }}
              className="px-2 py-1 text-[10px] rounded-lg border transition-colors duration-150"
              style={s === currentSize
                ? { background: c.textPrimary, color: c.background, borderColor: c.textPrimary }
                : { borderColor: c.border, color: c.textSecondary, background: "transparent" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// Section 11 — FAB Behavior: lifts back into view scrolling up, tucks
// mostly out of the way scrolling down, and never during a drag/resize
// (editMode already unmounts it at both call sites). Finds its own nearest
// scrollable ancestor rather than requiring every page to thread scroll
// state down to it, so both call sites (WidgetBoard's board-aware FAB and
// AppShell's shared one) get the same behavior for free.
function useHideFabOnScrollDown(nodeRef) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    let scrollEl = node.parentElement;
    while (scrollEl && scrollEl !== document.body) {
      const style = window.getComputedStyle(scrollEl);
      if (style.overflowY === "auto" || style.overflowY === "scroll") break;
      scrollEl = scrollEl.parentElement;
    }
    if (!scrollEl || scrollEl === document.body) return;
    let lastTop = scrollEl.scrollTop;
    const onScroll = () => {
      const top = scrollEl.scrollTop;
      const delta = top - lastTop;
      if (top < 24) setHidden(false);
      else if (delta > 4) setHidden(true);
      else if (delta < -4) setHidden(false);
      lastTop = top;
    };
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, [nodeRef]);
  return hidden;
}

function FloatingActionButton({ onClick, hidden: hiddenProp }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const depth = 5;
  const { ripples, onPointerDown } = usePlugRipple();
  const wrapRef = useRef(null);
  const autoHidden = useHideFabOnScrollDown(wrapRef);
  const hidden = hiddenProp ?? autoHidden;
  return (
    <div
      ref={wrapRef}
      className="fixed bottom-6 right-6 z-30"
      style={{
        transform: hidden ? "translateY(140%) scale(0.9)" : "translateY(0) scale(1)",
        opacity: hidden ? 0 : 1,
        transition: `transform var(--motion-base) cubic-bezier(0.22,1,0.36,1), opacity var(--motion-base) ease`,
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      <button
        onClick={onClick}
        onPointerDown={(e) => { onPointerDown(e); triggerHaptic("light", theme.reducedMotion); }}
        aria-label="Create"
        className="pui-press rounded-full flex items-center justify-center"
        style={{
          width: 58,
          height: 58,
          // Slightly richer top-to-bottom gradient than a standard button
          // face — this is the app's one persistent "always visible"
          // surface, so it earns a touch more presence than an inline
          // button without changing its size, position, or press behavior.
          // Dark Mode pushes the highlight and the colored ambient shadow a
          // little further, making the FAB read as the screen's one visual
          // accent the way a flagship app's would, without any actual glow.
          background: theme.isDark
            ? `linear-gradient(180deg, ${lighten(c.primary, 0.16)}, ${c.primary} 50%, ${darken(c.primary, 0.04)})`
            : `linear-gradient(180deg, ${lighten(c.primary, 0.1)}, ${c.primary} 55%, ${darken(c.primary, 0.02)})`,
          color: c.onAccent,
          border: `1px solid ${withAlpha(lighten(c.primary, 0.25), theme.isDark ? 0.6 : 0.5)}`,
          overflow: "hidden",
          "--pui-elevation": theme.isDark
            ? `${theme.shadows.floating}, 0 10px 28px ${withAlpha(c.primary, 0.35)}`
            : theme.shadows.floating,
          "--pui-depth": `${depth}px`,
          "--pui-depth-color": darken(c.primary, 0.22),
        }}
      >
        <Plus size={26} />
        <RippleLayer ripples={ripples} />
      </button>
    </div>
  );
}

/* ============================================================
   SECTION 5 — WIDGET BOARD
   The 2x4 grid itself: hover highlight, placed widgets, empty
   "+" slots, and the floating drag clone. Takes the board hook's
   return value as a single prop so it never needs to know how
   that state is produced.
   ============================================================ */

function WidgetBoard({ board, onOpenPicker }) {
  const { theme } = useTheme();
  const {
    widgets, editMode, drag, resizeMenuFor, gridRef,
    handlePointerDown, handlePointerMove, handlePointerUp,
    deleteWidget, resizeWidget, toggleResizeMenu,
  } = board;

  const occ = buildOccupancy(widgets, null);
  const emptyCells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      if (!occ[`${r}-${c}`]) emptyCells.push({ r, c });
    }
  }
  const draggedWidget = drag ? widgets.find((w) => w.id === drag.id) : null;

  return (
    <>
      <style>{`
        @keyframes jiggle {
          0% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
          100% { transform: rotate(-1deg); }
        }
        .jiggle { animation: jiggle 0.22s infinite ease-in-out; }
      `}</style>

      <div
        ref={gridRef}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, ${CELL_H}px)`,
          gap: GAP,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* hover target highlight while dragging */}
        {drag && (
          <div style={{ ...gridSpan(drag.hoverRow, drag.hoverCol, drag.w, drag.h), pointerEvents: "none" }}>
            <div
              className="w-full h-full rounded-2xl border-2 border-dashed"
              style={{
                borderColor: drag.ok ? theme.colors.success : theme.colors.danger,
                background: drag.ok ? withAlpha(theme.colors.success, 0.08) : withAlpha(theme.colors.danger, 0.08),
              }}
            />
          </div>
        )}

        {/* widgets */}
        {widgets.map((wd) => {
          const { w, h } = dims(wd.size);
          const def = getWidgetDef(wd.type);
          const isDragging = drag && drag.id === wd.id;
          return (
            <div key={wd.id} style={{ ...gridSpan(wd.row, wd.col, w, h), zIndex: isDragging ? 5 : 1 }}>
              <div
                onPointerDown={(e) => handlePointerDown(e, wd)}
                onPointerMove={(e) => handlePointerMove(e, wd)}
                onPointerUp={(e) => handlePointerUp(e, wd)}
                onContextMenu={(e) => e.preventDefault()}
                className="relative w-full h-full"
                style={{
                  opacity: isDragging ? 0.25 : 1,
                  touchAction: "none",
                  cursor: editMode ? "grab" : "default",
                  // Prompt 1I — same appear animation used app-wide
                  // (pui-screen-in), so a newly placed widget arrives with
                  // the same motion language as everything else instead of
                  // popping in with no transition.
                  animation: theme.reducedMotion ? "none" : "pui-screen-in var(--motion-base, 220ms) ease",
                }}
              >
                <Widget def={def} shape={wd.shape} size={wd.size} jiggle={editMode && !isDragging} />
                {editMode && (
                  <EditOverlay
                    onDelete={() => deleteWidget(wd.id)}
                    allowedSizes={def.allowedSizes}
                    currentSize={wd.size}
                    resizeMenuOpen={resizeMenuFor === wd.id}
                    onToggleResize={() => toggleResizeMenu(wd.id)}
                    onPickSize={(s) => resizeWidget(wd.id, s)}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* empty "+" slots */}
        {emptyCells.map(({ r, c }) => (
          <div
            key={`${r}-${c}`}
            style={{
              ...gridSpan(r, c, 1, 1),
              animation: theme.reducedMotion ? "none" : "pui-screen-in var(--motion-base, 220ms) ease",
            }}
          >
            <button
              onClick={() => onOpenPicker(r)}
              className="pui-press w-full h-full flex items-center justify-center rounded-[26px]"
              style={chunkyVars(theme, "card", 4)}
            >
              {/* Solid icon-chip, matching Widget's icon badge treatment —
                  an empty slot is a real tap target, so it gets the same
                  chunky language as everything else instead of looking
                  like a disabled placeholder. */}
              <span
                className="flex items-center justify-center w-9 h-9 rounded-full"
                style={{ background: theme.colors.primary, color: theme.colors.onAccent, boxShadow: `0 2px 0 ${darken(theme.colors.primary, 0.2)}` }}
              >
                <Plus size={18} />
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* floating drag clone */}
      {drag && draggedWidget && (() => {
        const def = getWidgetDef(draggedWidget.type);
        return (
          <div
            style={{
              position: "fixed",
              left: drag.x - drag.offsetX,
              top: drag.y - drag.offsetY,
              width: drag.boxW,
              height: drag.boxH,
              pointerEvents: "none",
              zIndex: 1000,
              border: `1px solid ${theme.colors.border}`,
              background: theme.colors.card,
              boxShadow: theme.shadows.floating,
              opacity: 0.9,
            }}
          >
            <div className="relative w-full h-full">
              <Widget def={def} shape={draggedWidget.shape} size={draggedWidget.size} />
            </div>
          </div>
        );
      })()}
    </>
  );
}

/* ============================================================
   SECTION 6 — WIDGET PICKER
   Owns its own wizard state (type -> shape -> size). The only
   thing it needs from outside is which empty slot was tapped and
   a way to attempt placement; it decides for itself whether to
   advance, skip the size step, or show "board is full".
   ============================================================ */

function WidgetPicker({ openRow, onClose, onConfirm, usedSlots, totalSlots, remainingSlots }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [stage, setStage] = useState("category");
  const [category, setCategory] = useState(null);
  const [type, setType] = useState(null);
  const [shape, setShape] = useState(null);

  useEffect(() => {
    if (openRow !== null) {
      setStage("category");
      setCategory(null);
      setType(null);
      setShape(null);
    }
  }, [openRow]);

  if (openRow === null) return null;

  const place = (size) => {
    const result = onConfirm(type, shape, size, openRow);
    if (result) {
      onClose();
    } else {
      setStage("full");
    }
  };

  const handlePickCategory = (id) => {
    setCategory(id);
    setStage("type");
  };

  const handlePickType = (t) => {
    setType(t);
    setStage("shape");
  };

  const handlePickShape = (s) => {
    setShape(s);
    const def = getWidgetDef(type);
    if (def.allowedSizes.length === 1) {
      place(def.allowedSizes[0]);
    } else {
      setStage("size");
    }
  };

  const title =
    stage === "category" ? "What kind of widget?" :
    stage === "type" ? "Choose a widget" :
    stage === "shape" ? "Choose a shape" :
    stage === "size" ? "Choose a size" :
    "Board is full";

  return (
    <BottomSheet open onClose={onClose} title={title}>
      {stage === "category" && (
        <div
          className="grid grid-cols-2 gap-2.5"
          style={{ animation: theme.reducedMotion ? "none" : "pui-fade-in var(--motion-base, 200ms) ease" }}
        >
          {WIDGET_QUICK_MENU_CATEGORIES.map(({ id, label, icon: IconCmp }) => (
            <button
              key={id}
              onClick={() => handlePickCategory(id)}
              className="pui-press flex flex-col items-center justify-center gap-2 rounded-2xl py-5"
              style={chunkyVars(theme, "card", 4)}
            >
              <span
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{ background: c.buttonPrimaryBg, color: c.buttonPrimaryText, boxShadow: `0 2px 0 ${darken(c.buttonPrimaryBg, 0.2)}` }}
              >
                <IconCmp size={20} />
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      )}
      {stage === "type" && (
        <div
          className="flex flex-col gap-2.5"
          style={{ animation: theme.reducedMotion ? "none" : "pui-fade-in var(--motion-base, 200ms) ease" }}
        >
          {WIDGET_REGISTRY.filter((def) => def.category === category).map((def) => (
            <button
              key={def.type}
              onClick={() => handlePickType(def.type)}
              className="pui-press flex items-center gap-3 w-full rounded-2xl p-3 text-left"
              style={chunkyVars(theme, "card", 4)}
            >
              <span
                className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                style={{ background: c.buttonPrimaryBg, color: c.buttonPrimaryText, boxShadow: `0 2px 0 ${darken(c.buttonPrimaryBg, 0.2)}` }}
              >
                <def.icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-tight">{def.title}</div>
                <div className="text-xs mt-0.5 leading-tight truncate" style={{ color: c.muted }}>{def.description}</div>
              </div>
              <ChevronRight size={16} style={{ color: c.muted }} className="shrink-0" />
            </button>
          ))}
        </div>
      )}

      {stage === "shape" && (
        <div className="grid grid-cols-2 gap-3">
          {ALL_SHAPES.map((s) => (
            <button
              key={s}
              onClick={() => handlePickShape(s)}
              className="pui-press flex flex-col items-center justify-center gap-2 py-4"
              style={{ ...chunkyVars(theme, "card", 4), ...shapeStyle(s) }}
            >
              <div style={{ ...shapeStyle(s), background: c.buttonPrimaryBg }} className="w-11 h-11" />
              <span className="text-xs font-semibold capitalize">{s}</span>
            </button>
          ))}
        </div>
      )}

      {stage === "size" && (
        <div className="grid grid-cols-2 gap-2.5">
          {getWidgetDef(type).allowedSizes.map((s) => (
            <button
              key={s}
              onClick={() => place(s)}
              className="pui-press rounded-2xl py-3 text-sm font-semibold"
              style={chunkyVars(theme, "card", 4)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {stage === "full" && (
        <div className="text-sm leading-relaxed" style={{ color: c.textSecondary }}>
          This board has {remainingSlots} of {totalSlots} slots free, but none of them are large
          enough for this widget's shape. Delete or resize something first.
        </div>
      )}
    </BottomSheet>
  );
}

const CREATE_GROUPS = [
  {
    title: "Study",
    items: [
      { label: "New Course", icon: GraduationCap },
      { label: "New Subject", icon: BookOpen },
      { label: "New Topic", icon: Layers },
      { label: "New Lesson", icon: Play },
    ],
  },
  {
    title: "Notes",
    items: [
      { label: "New Note", icon: FileText },
      { label: "New Folder", icon: FolderPlus },
      { label: "New Collection", icon: FolderTree },
      { label: "New Template", icon: FileBadge2 },
    ],
  },
  {
    title: "Review",
    items: [
      { label: "New Flashcard Deck", icon: Bookmark },
      { label: "New Quiz Set", icon: ListChecks },
      { label: "New Review Session", icon: Clock },
    ],
  },
  {
    title: "Organization",
    items: [
      { label: "New Bookmark", icon: Star },
      { label: "New Tag", icon: Tag },
      { label: "New Preset", icon: SlidersHorizontal },
    ],
  },
];

// The FAB's create menu, plus a second sheet for whichever action was
// picked. Kept as two stacked sheets rather than full page navigation —
// creation is a quick, dismissable action from anywhere in the app, not a
// destination you drill into. Actions are grouped under section headers
// (reusing SearchGroupLabel, the same grouped-list header the search
// overlay uses) so the menu scans as categories instead of one long list.
function CreateSheet({ open, onClose }) {
  const [active, setActive] = useState(null);
  const { show } = useToast();
  const { theme } = useTheme();
  const c = theme.colors;

  useEffect(() => {
    if (!open) setActive(null);
  }, [open]);

  return (
    <>
      <BottomSheet open={open && !active} onClose={onClose} title="Create">
        <div className="flex flex-col">
          {CREATE_GROUPS.map((group) => (
            <div key={group.title}>
              <SearchGroupLabel>{group.title}</SearchGroupLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {group.items.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => setActive(a.label)}
                    className="flex flex-col items-start gap-2.5 rounded-xl p-3.5 text-left pui-lift hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150"
                    style={{ border: `1px solid ${c.border}`, background: c.card }}
                  >
                    <a.icon size={16} style={{ color: c.textSecondary }} />
                    <span className="text-sm leading-tight" style={{ color: c.textPrimary }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={!!active} onClose={() => setActive(null)} title={active || ""}>
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-xs font-medium mb-1.5" style={{ color: c.textSecondary }}>Name</div>
            <div className="rounded-xl px-3.5 py-2.5 text-sm" style={{ border: `1px solid ${c.border}`, color: c.muted, background: c.surface }}>
              Untitled
            </div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1.5" style={{ color: c.textSecondary }}>Details</div>
            <div className="rounded-xl px-3.5 py-6 text-sm text-center" style={{ border: `1px solid ${c.border}`, color: c.muted, background: c.surface }}>
              Form fields go here
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                const created = active;
                setActive(null);
                onClose();
                triggerHaptic("medium", theme.reducedMotion);
                show(`${created} created`);
              }}
              className="flex-1"
            >
              Create
            </Button>
            <button
              onClick={() => setActive(null)}
              className="px-4 py-2.5 rounded-xl text-sm pui-lift hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150"
              style={{ border: `1px solid ${c.border}`, color: c.textSecondary }}
            >
              Back
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

/* ============================================================
   SECTION 6B — DRILL-DOWN ENGINE
   One generic explorer, driven entirely by a per-screen config
   (level labels + branching factor + icon). Giving a new section
   drill-down means adding one entry to HIERARCHY_REGISTRY — the
   component, the breadcrumb, and the children generator never
   need to know which section they're rendering.
   ============================================================ */

const HIERARCHY_REGISTRY = {
  courses: {
    levels: ["Modules", "Lessons", "Topic", "Material"], branching: 4, icon: Layers,
    materials: true, // last level renders the Learning Materials grid instead of the generic placeholder
  },
  // Notes intentionally has NO entry here. A Notes folder is a real file
  // directory, not a drill-down hierarchy of synthetic Sections/Pages —
  // it's rendered by NotesFolderPage instead (see AppShell), so it never
  // falls into the generic Course-style explorer (Overview/Lessons/
  // Flashcards/Quiz/...) that every other section in this registry uses.
  study: { levels: ["Sub-decks", "Cards"], branching: 4, icon: Bookmark },
  review: { levels: ["Breakdown", "Cards"], branching: 3, icon: Clock },
  progress: { levels: ["Topics", "Material"], branching: 4, icon: BarChart3 },
  // Single-level "detail" sections: the root pick (a settings category, a
  // saved group, ...) lands directly on its own placeholder page — no
  // synthetic children to browse through first.
  settings: {
    levels: [], icon: Settings,
    emptyTitle: (label) => `${label} settings`,
    emptySubtitle: "This category's controls will live here. UI shell only for now.",
  },
  saved: {
    levels: [], icon: Star,
    emptyTitle: (label) => label,
    emptySubtitle: "Items you save into this collection will show up here.",
  },
  presets: {
    levels: [], icon: SlidersHorizontal,
    emptyTitle: (label) => label,
    emptySubtitle: "Build and save custom presets here once this is wired up.",
  },
};

// Purely synthetic children — same shape at every depth, for every section.
// This is UI-only placeholder architecture: no backend, but every level
// genuinely exists and can be drilled into.
function getDrillChildren(config, depth) {
  const label = config.levels[depth];
  return Array.from({ length: config.branching }, (_, i) => ({
    id: `${depth}-${i}`,
    label: `${label} ${i + 1}`,
  }));
}

function DrillBreadcrumb({ trail, onJump }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div className="flex items-center gap-1 flex-wrap pb-1 text-xs" style={{ color: c.muted }}>
      {trail.map((node, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={12} className="shrink-0" style={{ color: c.disabled }} />}
          <button
            onClick={() => onJump(i)}
            className="truncate max-w-[130px]"
            style={i === trail.length - 1 ? { color: c.textPrimary, fontWeight: 500 } : { color: c.muted }}
          >
            {node.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ============================================================
   SECTION 6B-PRE — MATERIAL RESOURCE SYSTEM
   Makes "one Material is the source of everything" real architecture
   instead of a diagram: one table of every resource type a Material
   can carry (source content someone brought in, plus content that
   will be AI-generated later) and one generic per-material store any
   of those types can register into. Adding a new generated type later
   — something beyond Flashcards/Quiz/Reviewer/Summary/Practice
   Questions — means adding a row to MATERIAL_RESOURCE_REGISTRY;
   nothing about the Material page, the Smart Overview below, or the
   existing resource grid needs to change.
   No generation happens here — every resource starts "unavailable"
   and stays that way until a real producer (an import flow, an AI
   job) calls register()/setStatus() later. That's out of scope for
   this prompt on purpose.
   ============================================================ */

const MATERIAL_RESOURCE_REGISTRY = [
  // Source resources — content someone (or an import) brought into the
  // Material directly. The existing "Learning Material" grid below is its
  // own, already-shipped rendering of this same idea; kept as-is rather
  // than re-pointed at this table so this pass doesn't change what that
  // grid looks like.
  { key: "reading", label: "Reading Material", icon: FileText, kind: "source" },
  { key: "lectureNotes", label: "Lecture Notes", icon: StickyNote, kind: "source" },
  { key: "slides", label: "Slides", icon: LayoutGrid, kind: "source" },
  { key: "pdf", label: "PDF", icon: FileBadge2, kind: "source" },
  { key: "images", label: "Images", icon: Image, kind: "source" },
  { key: "videos", label: "Videos", icon: Video, kind: "source" },
  { key: "audio", label: "Audio", icon: Music, kind: "source" },
  { key: "references", label: "References", icon: Link2, kind: "source" },
  // Generated resources — conceptually produced FROM the Material's source
  // content rather than authored directly. `smartLabel` is what the Smart
  // Overview calls this once it's ready (e.g. a quiz set is "Quiz Ready"
  // there, but still just "Quiz Set" wherever it's listed as a resource).
  { key: "flashcards", label: "Flashcards", icon: Bookmark, kind: "generated", smartLabel: "Flashcards Available" },
  { key: "quizSet", label: "Quiz Set", icon: ListChecks, kind: "generated", smartLabel: "Quiz Ready" },
  { key: "reviewer", label: "Reviewer", icon: Clock, kind: "generated", smartLabel: "Resume Review" },
  { key: "summary", label: "Summary", icon: FileBadge2, kind: "generated", smartLabel: "Generated Summary" },
  { key: "practiceQuestions", label: "Practice Questions", icon: HelpCircle, kind: "generated", smartLabel: "Practice Questions" },
];

// A Material has no real backing entity yet (see DrillDownExplorer — the
// nodes below the root are synthetic), so its identity is the trail that
// got you there. Same pattern App already uses for scroll-position keys.
function materialResourceKey(trail) {
  return trail.map((n) => n.label).join(" / ");
}

const MaterialResourceContext = React.createContext(null);

// One flat store: materialKey -> resourceKey -> { status, ...data }.
function MaterialResourceProvider({ children }) {
  const [resources, setResources] = useState({});

  const registerResource = useCallback((matKey, resourceKey, data = {}) => {
    setResources((prev) => ({
      ...prev,
      [matKey]: {
        ...prev[matKey],
        [resourceKey]: { ...prev[matKey]?.[resourceKey], ...data, status: "available" },
      },
    }));
  }, []);

  const setResourceStatus = useCallback((matKey, resourceKey, status, data = {}) => {
    setResources((prev) => ({
      ...prev,
      [matKey]: {
        ...prev[matKey],
        [resourceKey]: { ...prev[matKey]?.[resourceKey], ...data, status },
      },
    }));
  }, []);

  const getMaterialResources = useCallback((matKey) => resources[matKey] || {}, [resources]);

  const value = { registerResource, setResourceStatus, getMaterialResources };
  return <MaterialResourceContext.Provider value={value}>{children}</MaterialResourceContext.Provider>;
}

function useMaterialResourceSystem() {
  const ctx = React.useContext(MaterialResourceContext);
  if (!ctx) throw new Error("useMaterialResourceSystem must be used within a MaterialResourceProvider");
  return ctx;
}

// Everything one Material's page needs: every registry entry, merged with
// whatever's actually been registered for this specific Material (nothing,
// today). `register`/`setStatus` are what a future generator calls —
// passing this Material's key plus a registry `key` — to make one of its
// resources real.
function useMaterialResources(matKey) {
  const { getMaterialResources, registerResource, setResourceStatus } = useMaterialResourceSystem();
  const live = getMaterialResources(matKey);

  const resources = MATERIAL_RESOURCE_REGISTRY.map((def) => ({
    ...def,
    status: "unavailable",
    ...live[def.key],
  }));

  return {
    resources,
    source: resources.filter((r) => r.kind === "source"),
    generated: resources.filter((r) => r.kind === "generated"),
    register: (resourceKey, data) => registerResource(matKey, resourceKey, data),
    setStatus: (resourceKey, status, data) => setResourceStatus(matKey, resourceKey, status, data),
  };
}

// What the Smart Overview shows, in order. Placeholder ranking on purpose
// (generated resources, in registry order) — a real version later would
// weigh recency/progress/what the learner touched last instead of just
// registry order, but the shape (an ordered list of "most useful next
// resource" cards) doesn't change when that logic arrives.
function useSmartOverview(matKey) {
  const { generated } = useMaterialResources(matKey);
  return generated;
}


// The reusable drill-down surface. `trail` is the chain of selections made
// so far — trail[0] is the root item picked from the section's normal list
// page, everything after comes from getDrillChildren. Once the trail runs
// past the configured levels, this renders the Material placeholder instead
// of another list. This array is the existing, already-shipped "Learning
// Material" grid — left untouched by the Material Resource System above so
// the resource library keeps looking exactly like it did before.
const LEARNING_MATERIAL_ITEMS = [
  { label: "Reading Material", icon: FileText },
  { label: "Lecture Notes", icon: StickyNote },
  { label: "Slides", icon: LayoutGrid },
  { label: "PDF", icon: FileBadge2 },
  { label: "Images", icon: Image },
  { label: "Videos", icon: Video },
  { label: "Audio", icon: Music },
  { label: "Objectives", icon: Target },
  { label: "Summary", icon: FileText },
  { label: "Glossary", icon: BookOpen },
  { label: "References", icon: Link2 },
  { label: "Attachments", icon: Paperclip },
  { label: "Related Lessons", icon: Layers },
  { label: "Resources", icon: Globe },
];

// The landing page right after picking a root item (a course, a note
// folder, a deck, ...) — shown once, at depth 0, before the generic
// level-by-level lists start. Gives that first page its own shape (a grid
// of sections) rather than looking identical to every deeper list level.
const SUBJECT_SECTIONS = [
  { label: "Overview", icon: Info },
  { label: "Lessons", icon: Play },
  { label: "Flashcards", icon: Bookmark },
  { label: "Notes", icon: FileText },
  { label: "Quiz", icon: ListChecks },
  { label: "Progress", icon: BarChart3 },
];

// Phase 7A — the app's biggest feature isn't the material library above,
// it's active, AI-driven recall: Smart Review, adaptive difficulty, weak-
// topic targeting. These are the actions a Course/Deck/Quiz Set landing
// page leads with now, presented as their own registry (same shape as
// STUDY_MODE_REGISTRY/STUDY_HUB_MODES elsewhere) so a future mode is one
// entry here, not a layout change.
const SUBJECT_STUDY_MODES = [
  { id: "smartReview", label: "Smart Review", icon: Sparkles, description: "AI picks what to review next" },
  { id: "weakTopics", label: "Weak Topics", icon: Target, description: "Focus on what needs work" },
  { id: "rapidReview", label: "Rapid Review", icon: Zap, description: "Quick-fire recall, no breaks" },
  { id: "examSimulation", label: "Exam Simulation", icon: GraduationCap, description: "Full-length practice exam" },
  { id: "adaptiveSession", label: "Adaptive Session", icon: TrendingUp, description: "Difficulty adjusts as you go" },
  { id: "randomMixedReview", label: "Random Mixed Review", icon: ArrowUpDown, description: "Shuffled across every topic" },
  { id: "timedChallenge", label: "Timed Challenge", icon: Timer, description: "Race the clock" },
];

// The new #1 thing on a Course/Subject/Deck/Quiz Set/Flashcard Set landing
// page — a large, premium, unmissable call-to-action that leads with
// studying instead of browsing. Sample due-count/time/progress follow the
// same "UI shell, no backend yet" placeholder pattern the rest of the file
// already uses (StudyPage's Due Today, SAMPLE_DECKS, ...).
function SubjectStudyHeroCard({ rootLabel }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const dueToday = 18;
  const estMinutes = 22;
  const progressPct = 64;

  return (
    <div
      className="relative rounded-3xl"
      style={{
        background: `linear-gradient(135deg, ${lighten(c.primary, 0.05)}, ${c.primary} 45%, ${darken(c.primary, 0.22)})`,
        // The one card on the page that should visually dominate: floating
        // well above everything below it, with a soft top highlight baked
        // into the shadow stack rather than a flat fill — same "molded
        // surface" language as Card/FAB, just turned up for its one moment
        // as the page's primary action.
        boxShadow: theme.isDark
          ? `${theme.shadows.floating}, 0 20px 48px ${withAlpha(c.primary, 0.32)}, inset 0 1px 0 ${withAlpha("#FFFFFF", 0.14)}`
          : `${theme.shadows.high}, inset 0 1px 0 ${withAlpha("#FFFFFF", 0.3)}`,
        padding: theme.spacing.xl,
      }}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: withAlpha(c.onAccent, 0.75) }}>
        <Sparkles size={12} />
        Smart Review
      </div>
      <Text as="div" variant="heading" style={{ color: c.onAccent, marginTop: theme.spacing.xs }}>
        Ready to study {rootLabel}?
      </Text>
      <Text as="div" variant="body" style={{ color: withAlpha(c.onAccent, 0.82), marginTop: 4 }}>
        Your next review is queued up and ready to go.
      </Text>

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span className="text-xs font-semibold rounded-full px-3 py-1.5" style={{ background: withAlpha("#FFFFFF", 0.16), color: c.onAccent }}>
          {dueToday} due today
        </span>
        <span className="text-xs font-semibold rounded-full px-3 py-1.5" style={{ background: withAlpha("#FFFFFF", 0.16), color: c.onAccent }}>
          ~{estMinutes} min
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: withAlpha(c.onAccent, 0.75) }}>
          <span>Course progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden mt-1.5" style={{ background: withAlpha("#000000", 0.18) }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${progressPct}%`, background: withAlpha("#FFFFFF", 0.85), transition: theme.reducedMotion ? "none" : "width var(--motion-slow) cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </div>
      </div>

      <button
        onClick={() => {}}
        className="w-full flex items-center justify-center gap-2 pui-press mt-5"
        style={{
          background: c.onAccent,
          color: darken(c.primary, 0.3),
          borderRadius: theme.radius.md,
          padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
          fontFamily: "var(--font-family)",
          fontSize: `${theme.typography.button.size}px`,
          fontWeight: 700,
          marginBottom: 4,
          "--pui-depth": "4px",
          "--pui-depth-color": withAlpha("#000000", 0.18),
        }}
      >
        <Play size={16} />
        Start Smart Review
      </button>
    </div>
  );
}

// Study Modes are actions, not resources — a distinct card face (an
// accent-tinted icon well and a hairline accent border) from CategoryCard's
// neutral one below, so the two grids read as two different kinds of thing
// at a glance instead of one long undifferentiated list of tiles.
function StudyModeCard({ mode, onClick }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const Icon = mode.icon;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2.5 pui-lift hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-left"
      style={{
        background: theme.isDark
          ? `linear-gradient(180deg, ${lighten(c.card, 0.022)}, ${c.card})`
          : `linear-gradient(180deg, ${lighten(c.card, 0.012)}, ${c.card})`,
        border: `1px solid ${withAlpha(c.primary, theme.isDark ? 0.28 : 0.18)}`,
        boxShadow: theme.shadows.low,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 36, height: 36, borderRadius: theme.radius.md, background: withAlpha(c.primary, theme.isDark ? 0.18 : 0.1) }}
      >
        <Icon size={16} style={{ color: c.primary }} />
      </div>
      <div className="min-w-0 w-full">
        <Text as="div" variant="body" weight={600} className="truncate">{mode.label}</Text>
        <Text as="div" variant="caption" color={c.muted} className="truncate" style={{ marginTop: 2 }}>{mode.description}</Text>
      </div>
    </button>
  );
}

// The intelligent layer on top of the existing resource grid — not a
// replacement for it. Renders every "generated" registry entry as a
// compact card: available ones (none, by default — see Section 6B-PRE)
// look like a normal tappable card, everything else reads as "not
// generated yet," reusing the same dashed/muted treatment
// STUDY_MODE_REGISTRY's inactive modes already use elsewhere in the app.
// Returns null (renders nothing) if a Material somehow has no candidate
// resources at all, so an empty overview never leaves a blank gap.
function MaterialSmartOverview({ matKey }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const items = useSmartOverview(matKey);
  if (items.length === 0) return null;

  return (
    <>
      <SectionHeading>Smart Overview</SectionHeading>
      <HorizontalCarousel scrollKey={`smart-overview-${matKey}`}>
        {items.map((r) => {
          const ready = r.status === "available" || r.status === "generating";
          return (
            <button
              key={r.key}
              onClick={() => {}}
              className="flex flex-col items-start gap-2 shrink-0 w-36 rounded-2xl p-3 text-left pui-lift transition-all duration-150 active:scale-[0.98]"
              style={{
                scrollSnapAlign: "start",
                ...(ready
                  ? { background: c.card, border: `1px solid ${c.border}`, boxShadow: theme.shadows.low }
                  : { background: withAlpha(c.surface, 0.7), border: `1px dashed ${c.border}`, opacity: 0.7 }),
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={ready ? { background: c.surface } : { background: c.card, border: `1px solid ${c.border}` }}
              >
                <r.icon size={14} style={{ color: ready ? c.textSecondary : c.muted }} />
              </div>
              <div className="min-w-0 w-full">
                <div className="text-xs font-medium truncate" style={{ color: ready ? c.textPrimary : c.textSecondary }}>
                  {r.smartLabel || r.label}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: c.muted }}>
                  {r.status === "generating" ? "Generating…" : ready ? "Ready" : "Not generated yet"}
                </div>
              </div>
            </button>
          );
        })}
      </HorizontalCarousel>
    </>
  );
}

function DrillDownExplorer({ config, trail, onDrill, onJump }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const depth = trail.length - 1;
  const atMaterial = depth >= config.levels.length;
  const atSubjectLanding = depth === 0 && config.levels.length > 0;
  const Icon = config.icon;
  const rootLabel = trail[trail.length - 1]?.label || "";

  return (
    <div className="px-4 pt-4 pb-10">
      <DrillBreadcrumb trail={trail} onJump={onJump} />

      {atSubjectLanding && (
        <>
          {config.materials ? (
            // Phase 7A — the app's biggest feature is the intelligent
            // review system, not the file library below, so the page now
            // leads with studying: a dominant Hero Study Card, then Study
            // Modes (actions), then Study Materials (resources, renamed
            // from "Sections" so it reads as raw material rather than "how
            // you're expected to study"), then Modules — same order the
            // prompt specifies, nothing removed, just reordered.
            <>
              <SubjectStudyHeroCard rootLabel={rootLabel} />

              <SectionHeading>Study Modes</SectionHeading>
              <div className="grid grid-cols-2 gap-2.5">
                {SUBJECT_STUDY_MODES.map((m) => (
                  <StudyModeCard key={m.id} mode={m} onClick={() => {}} />
                ))}
              </div>

              <SectionHeading>Study Materials</SectionHeading>
              <div className="grid grid-cols-2 gap-2.5">
                {SUBJECT_SECTIONS.map((s) => (
                  <CategoryCard key={s.label} icon={s.icon} label={s.label} onClick={() => {}} />
                ))}
              </div>
            </>
          ) : (
            <>
              <SectionHeading>Sections</SectionHeading>
              <div className="grid grid-cols-2 gap-2.5">
                {SUBJECT_SECTIONS.map((s) => (
                  <CategoryCard key={s.label} icon={s.icon} label={s.label} onClick={() => {}} />
                ))}
              </div>
            </>
          )}
          <SectionHeading>{config.levels[0]}</SectionHeading>
        </>
      )}

      {atMaterial ? (
        <div className="mt-3">
          {config.materials ? (
            <>
              <MaterialSmartOverview matKey={materialResourceKey(trail)} />
              <SectionHeading>Learning Material</SectionHeading>
              <div className="grid grid-cols-2 gap-2.5">
                {LEARNING_MATERIAL_ITEMS.map((m) => (
                  <CategoryCard key={m.label} icon={m.icon} label={m.label} onClick={() => {}} />
                ))}
              </div>
            </>
          ) : config.customPages && config.customPages[rootLabel] ? (
            React.createElement(config.customPages[rootLabel])
          ) : (
            <EmptyState
              icon={FileText}
              title={config.emptyTitle ? config.emptyTitle(rootLabel) : "Material placeholder"}
              subtitle={
                config.emptySubtitle ||
                "This is where the actual content renders. No content is wired up yet — this is the navigation shell for it."
              }
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-3">
          {getDrillChildren(config, depth).map((node) => (
            <button
              key={node.id}
              onClick={() => onDrill(node)}
              className="flex items-center gap-3 rounded-2xl p-3.5 text-left pui-lift hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150"
              style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: theme.shadows.low }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.surface }}>
                <Icon size={16} style={{ color: c.textSecondary }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: c.textPrimary }}>{node.label}</div>
              </div>
              <ChevronRight size={16} className="shrink-0" style={{ color: c.disabled }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SECTION 6C — REUSABLE PAGE LAYOUT
   Courses, Notes, Flashcards, Quiz, Saved, Review, and Progress all
   share the same skeleton: an optional local title/action row, an
   optional hero/overview block, an optional category-card grid, an
   optional toolbar, the page's main content, and an optional FAB.
   (The App-level chrome — the top Header/HomeTopBar with menu/back —
   is owned by App and sits above this; this layout is the reusable
   shape of what each page puts *underneath* that chrome.)
   Each slot is a plain prop, so a page enables a section simply by
   passing it and disables one by leaving it out — nothing here
   forces a page to include a section it doesn't need.
   ============================================================ */

function PageHeader({ title, subtitle, actions }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center" style={{ gap: theme.spacing.sm }}>
        <span
          aria-hidden="true"
          className="rounded-full shrink-0"
          style={{ width: 6, height: 20, background: `linear-gradient(180deg, ${lighten(c.primary, 0.1)}, ${c.primary})` }}
        />
        <div>
          <div className="text-lg font-semibold tracking-tight leading-tight" style={{ color: c.textPrimary }}>{title}</div>
          {subtitle && <div className="text-xs mt-0.5" style={{ color: c.textSecondary }}>{subtitle}</div>}
        </div>
      </div>
      {actions}
    </div>
  );
}

function PageLayout({ header, hero, categories, toolbar, children, fab, className = "px-4 pt-4 pb-10" }) {
  return (
    <div className={`relative ${className}`}>
      {header && <PageHeader {...header} />}
      {hero}
      {categories}
      {toolbar}
      {children}
      {fab}
    </div>
  );
}

/* ============================================================
   SECTION 6D — FUTURE SYSTEM EXTENSION POINTS
   Establishes the shape future cross-app engines will plug into.
   No logic lives here yet — every page keeps using its current
   static local data/state (ChipRow selection, ListToolbar's sort/
   filter buttons, CreateSheet, ContextMenuSheet's Favorite/Pin) —
   these hooks are unused placeholders, not wired into any page, so
   nothing about current behavior changes by their being here.
   ============================================================ */

// Universal Filter Engine — reserved home for the real filtering/sorting
// logic behind every page's Toolbar (sort/filter buttons) and ChipRow
// (category/tag selection), which today are visual-only placeholders.
function useFilterEngine(config) {
  return {
    items: config?.source ?? [],
    activeFilters: {},
    sort: null,
    setFilter: () => {},
    clearFilters: () => {},
    setSort: () => {},
  };
}

// Universal Create Engine — reserved home for what CreateSheet's "Create"
// button and each page's local "+ New X" button will eventually do; today
// they just close their sheet without persisting anything.
function useCreateEngine(config) {
  return {
    create: () => {},
    isCreating: false,
    lastCreated: null,
  };
}

/* ============================================================
   SECTION 6E — UNIVERSAL SAVED SYSTEM
   One generic metadata store for "this entity has user data
   attached to it" — saved / pinned / favorite / archived / hidden,
   plus room for future custom tags. Every feature that used to
   maintain (or, until now, stub out) its own toggle — ContextMenuSheet's
   Favorite/Pin, each page's local Pinned section, the Saved page's
   category grid — reads and writes through this single system instead
   of duplicating state per content type. Nothing here knows about
   Courses vs Notes vs Decks specifically: any entity is just a
   {type, id} pair, so a brand-new content type gets saving/pinning/
   favoriting for free, with no changes to this file.
   ============================================================ */

const METADATA_FLAGS = ["saved", "pinned", "favorite", "archived", "hidden"];

function entityKey(type, id) {
  return `${type}:${id}`;
}

function blankEntity(type, id, seed) {
  return {
    type,
    id,
    label: seed?.label ?? String(id),
    icon: seed?.icon,
    meta: seed?.meta,
    saved: false,
    pinned: false,
    favorite: false,
    archived: false,
    hidden: false,
    tags: [],
  };
}

const EntityMetadataContext = React.createContext(null);

// Wraps the app once. Holds every entity's metadata in one flat table
// (entityKey -> {..flags, tags}) — one source of truth instead of one
// piece of local state per page/feature.
function SavedSystemProvider({ children }) {
  const [entities, setEntities] = useState({});

  const setFlag = useCallback((type, id, flag, value, seed) => {
    setEntities((prev) => {
      const key = entityKey(type, id);
      const existing = prev[key] || blankEntity(type, id, seed);
      return { ...prev, [key]: { ...existing, ...seed, [flag]: value } };
    });
  }, []);

  const toggleFlag = useCallback((type, id, flag, seed) => {
    setEntities((prev) => {
      const key = entityKey(type, id);
      const existing = prev[key] || blankEntity(type, id, seed);
      return { ...prev, [key]: { ...existing, ...seed, [flag]: !existing[flag] } };
    });
  }, []);

  const getEntity = useCallback((type, id) => entities[entityKey(type, id)], [entities]);

  // "Show me every saved entity" (or pinned, or favorite, ...) — optionally
  // scoped to one or more entity types. This is what lets the Saved page
  // and every page's local Pinned/Favorites section query real data
  // instead of maintaining their own hardcoded lists.
  const getAllWithFlag = useCallback(
    (flag, types) =>
      Object.values(entities).filter((e) => e[flag] && (!types || types.includes(e.type))),
    [entities]
  );

  const value = { entities, setFlag, toggleFlag, getEntity, getAllWithFlag };
  return <EntityMetadataContext.Provider value={value}>{children}</EntityMetadataContext.Provider>;
}

// The full engine — for call sites that need cross-entity queries (the
// Saved page, a Pinned section) rather than a single entity's flags.
function useEntityMetadata() {
  const ctx = React.useContext(EntityMetadataContext);
  if (!ctx) throw new Error("useEntityMetadata must be used within a SavedSystemProvider");
  return ctx;
}

// The common case — one entity's flags plus toggles for all of them.
// `seed` (label/icon/meta) is captured the first time this entity is
// touched so later readers (e.g. a Pinned list) can display it without a
// separate lookup table.
function useEntityFlags(type, id, seed) {
  const { getEntity, setFlag, toggleFlag } = useEntityMetadata();
  const entity = getEntity(type, id);
  return {
    saved: entity?.saved ?? false,
    pinned: entity?.pinned ?? false,
    favorite: entity?.favorite ?? false,
    archived: entity?.archived ?? false,
    hidden: entity?.hidden ?? false,
    toggleSaved: () => toggleFlag(type, id, "saved", seed),
    togglePinned: () => toggleFlag(type, id, "pinned", seed),
    toggleFavorite: () => toggleFlag(type, id, "favorite", seed),
    toggleArchived: () => toggleFlag(type, id, "archived", seed),
    toggleHidden: () => toggleFlag(type, id, "hidden", seed),
    set: (flag, value) => setFlag(type, id, flag, value, seed),
  };
}

// Thin single-flag views over useEntityFlags, matching the shapes named in
// the spec — for call sites that only care about one flag and would rather
// not destructure the full object.
function useSaved(type, id, seed) {
  const { saved, toggleSaved } = useEntityFlags(type, id, seed);
  return [saved, toggleSaved];
}
function usePinned(type, id, seed) {
  const { pinned, togglePinned } = useEntityFlags(type, id, seed);
  return [pinned, togglePinned];
}
function useFavorite(type, id, seed) {
  const { favorite, toggleFavorite } = useEntityFlags(type, id, seed);
  return [favorite, toggleFavorite];
}

// Replaces each page's own hardcoded "Pinned"/"Starred"/empty-forever
// section. Queries the shared metadata system for every entity carrying
// `flag` (scoped to `types`) and renders the same EmptyState that used to
// be permanently there when nothing qualifies yet — so a page with
// nothing pinned looks exactly like it did before this refactor.
function EntityFlagSection({ flag, types, icon, title, subtitle, emptyActions, onOpenEntity = () => {} }) {
  const { getAllWithFlag } = useEntityMetadata();
  const items = getAllWithFlag(flag, types);

  if (items.length === 0) {
    return <EmptyState icon={icon} title={title} subtitle={subtitle} actions={emptyActions} />;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((e) => (
        <ItemCard
          key={entityKey(e.type, e.id)}
          onClick={() => onOpenEntity(e.label)}
          icon={e.icon || icon}
          title={e.label}
          subtitle={e.meta}
        />
      ))}
    </div>
  );
}

/* ============================================================
   SECTION 7 — PAGES
   ============================================================ */

// Compact "continue where you left off" card. Intelligent selection of
// what to resume comes later — for now this is a static placeholder with
// no greeting, no user identity, just a single actionable card.
function ContinueCard() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <button
      className="pui-press flex items-center justify-between w-full rounded-[30px] px-5 py-6 text-left"
      style={chunkyVars(theme, "card", 4)}
    >
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide leading-tight" style={{ color: c.muted }}>
          Continue Studying
        </div>
        <div className="text-[21px] font-extrabold leading-tight mt-2 truncate" style={{ color: c.textPrimary }}>
          Pharmacology
        </div>
        <div className="text-sm font-medium leading-tight mt-1" style={{ color: c.textSecondary }}>Unit 3 • Flashcards</div>
      </div>
      <span
        className="pui-press flex items-center justify-center w-12 h-12 rounded-full shrink-0 ml-3"
        style={chunkyVars(theme, "primary", 3)}
      >
        <ChevronLeft size={19} className="rotate-180" />
      </span>
    </button>
  );
}

// Home intentionally does NOT use PageLayout — its "relative, full
// min-height" wrapper and its edit-mode-aware FAB don't match the shared
// list-page skeleton the other study pages use, and forcing it into that
// shape would change its appearance. It's the one page genuinely different
// in structure, not just content. Its padding, though, follows the same
// app-wide baseline (px-4 pt-4 pb-10) as PageLayout, so Home starts at
// exactly the same vertical offset as every other page.
function HomePage({ board }) {
  const [pickerRow, setPickerRow] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);
  const usedSlots = slotsUsed(board.widgets);
  const remainingSlots = TOTAL_SLOTS - usedSlots;

  return (
    <div className="relative" style={{ minHeight: "100%" }}>
      <div className="px-4 pt-4 pb-10">
        <ContinueCardCarousel />

        <SectionHeading>Workspace</SectionHeading>

        <WidgetBoard board={board} onOpenPicker={setPickerRow} />
      </div>

      {!board.editMode && <FloatingActionButton onClick={() => setFabOpen(true)} />}

      <WidgetPicker
        openRow={pickerRow}
        onClose={() => setPickerRow(null)}
        onConfirm={(type, shape, size, row) => board.addWidget(type, shape, size, row)}
        usedSlots={usedSlots}
        totalSlots={TOTAL_SLOTS}
        remainingSlots={remainingSlots}
      />

      <CreateSheet open={fabOpen} onClose={() => setFabOpen(false)} />
    </div>
  );
}

function ProfilePage() {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div>
      {/* banner */}
      <div className="w-full h-32" style={{ background: `linear-gradient(135deg, ${withAlpha(c.primary, 0.35)}, ${withAlpha(c.primary, 0.12)}, ${c.surface})` }} />
      <div className="px-4">
        {/* avatar overlaps banner */}
        <div className="w-20 h-20 rounded-full -mt-10 flex items-center justify-center" style={{ background: c.disabled, border: `4px solid ${c.background}`, boxShadow: theme.shadows.medium }}>
          <User size={32} style={{ color: c.onAccent }} />
        </div>
        {/* profile section */}
        <div className="mt-3 pb-5" style={{ borderBottom: `1px solid ${c.border}` }}>
          <div className="text-[17px] font-semibold tracking-tight" style={{ color: c.textPrimary }}>Learner Name</div>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1" style={{ color: c.textSecondary, background: c.surface }}>
              <Award size={12} style={{ color: c.muted }} />
              Level 4 · 1,240 XP
            </span>
            <span className="flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1" style={{ color: c.textSecondary, background: c.surface }}>
              <Flame size={12} style={{ color: c.muted }} />
              6-day streak
            </span>
          </div>
        </div>

        <SectionHeading>Stats</SectionHeading>
        <EmptyState
          icon={BarChart3}
          title="Stats are still warming up"
          subtitle="Study activity will start populating this section soon."
        />

        <SectionHeading>Achievements</SectionHeading>
        <div className="mb-6">
          <EmptyState
            icon={Award}
            title="No achievements yet"
            subtitle="Complete lessons and review streaks to start earning badges."
          />
        </div>
      </div>
    </div>
  );
}

// Small "eyebrow" section heading — matches the "Workspace" divider label
// used on Home, reused here so every study page shares the same rhythm.
function SectionHeading({ children, trailing }) {
  const { theme } = useTheme();
  return (
    <div className="flex items-center gap-2.5 mt-8 mb-3 first:mt-0">
      <Text
        variant="caption"
        weight={800}
        color="var(--pui-text-muted)"
        style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
      >
        {children}
      </Text>
      {/* Nudged up 1px so the hairline sits on the label's optical center
          rather than its baseline — otherwise a 1px border-top next to a
          small-caps caption reads as slightly low. */}
      <div className="flex-1 border-t" style={{ borderColor: theme.colors.border, marginTop: -1 }} />
      {trailing}
    </div>
  );
}

// Horizontal scroll-position table for RecentRow strips — same shape as
// the page-level scrollPositions/useScrollRestoration pair in Section 8B,
// but keyed per-strip (not per-screen) and tracking scrollLeft instead of
// scrollTop, so a "Recent" strip left scrolled halfway is exactly where it
// was left when the person navigates away and back.
const recentRowScrollPositions = {};

function useRecentRowScrollRestoration(key, ref) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = recentRowScrollPositions[key] || 0;

    const onScroll = () => { recentRowScrollPositions[key] = el.scrollLeft; };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [key, ref]);
}

// Section 9/7B — the ONE horizontal-scroll primitive every carousel in the
// app is built on: Recent strips, Smart Overview, and any future
// horizontally-scrollable section. Centralizing it here means left/right
// margin, inter-card gap, edge-fade, and snap physics can never drift
// between pages — fix it once, every carousel inherits the fix. `rows`
// switches between a single-row strip (rows=1, e.g. Smart Overview) and a
// two-row grid-flow strip (rows=2, e.g. every "Recent ___" section) without
// changing any of the shared scroll mechanics. scrollKey is optional — pass
// one to get cross-visit scroll-position restoration (matching RecentRow's
// existing behavior); omit it for strips that don't need it.
function HorizontalCarousel({ scrollKey, rows = 1, gap, children }) {
  const { theme } = useTheme();
  const ref = useRef(null);
  useRecentRowScrollRestoration(scrollKey ?? "__unkeyed__", ref);
  const g = gap ?? theme.spacing.sm;
  return (
    <div
      ref={ref}
      className={`${rows > 1 ? "grid grid-flow-col" : "flex"} items-stretch overflow-x-auto -mx-4 px-4 pui-scroll pui-edge-fade-x [&::-webkit-scrollbar]:hidden`}
      style={{
        gridTemplateRows: rows > 1 ? `repeat(${rows}, auto)` : undefined,
        columnGap: g,
        rowGap: g,
        gap: rows > 1 ? undefined : g,
        scrollSnapType: "x proximity",
      }}
    >
      {children}
    </div>
  );
}

// The shared "Recent ___" layout for every page that has one: exactly two
// items tall, anything beyond that reached by scrolling sideways instead
// of pushing the page taller — one component so every Recent section
// behaves identically instead of each page inventing its own cutoff, and
// one shared scroll-position table so each strip keeps its own offset.
// Children should be pre-sized (e.g. a fixed width per item) since a
// horizontal grid can't stretch them to fill the row the way a vertical
// list would. Thin wrapper around HorizontalCarousel (rows=2) — kept as
// its own named component since "RecentRow" at a call site is clearer than
// "HorizontalCarousel rows=2" every time.
function RecentRow({ scrollKey, children }) {
  return (
    <HorizontalCarousel scrollKey={scrollKey} rows={2}>
      {children}
    </HorizontalCarousel>
  );
}

// Rounded ends, a soft inset track (so the fill reads as sitting inside a
// groove), and a gentle gradient + highlight on the fill so progress feels
// like a rewarding, tactile fill rather than a flat bar.
function ProgressBar({ value, className = "" }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-2 w-full rounded-full overflow-hidden ${className}`}
      style={{ background: c.background, boxShadow: `inset 0 1px 2px ${withAlpha(c.textPrimary, 0.08)}` }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${lighten(c.primary, 0.08)}, ${c.primary})`,
          boxShadow: pct > 0 ? `inset 0 1px 0 ${withAlpha("#FFFFFF", 0.25)}` : "none",
          transition: theme.reducedMotion ? "none" : "width var(--motion-slow) cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}

function StatTile({ icon: Icon, label, value }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.surfaceText.card;
  const face = `linear-gradient(180deg, ${lighten(c.card, 0.012)}, ${c.card})`;
  const glow = `inset 0 1px 0 ${withAlpha("#FFFFFF", theme.isDark ? 0.03 : 0.5)}, inset 0 -1px 0 ${withAlpha(c.textPrimary, 0.025)}`;
  return (
    <div
      className="pui-lift"
      style={{
        background: face,
        border: `1px solid ${c.border}`,
        boxShadow: `${theme.shadows.low}, ${glow}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        ...surfaceVars(t),
      }}
    >
      <span style={{ color: "var(--pui-text-muted)" }}><Icon size={16} /></span>
      <Text as="div" variant="heading" style={{ marginTop: theme.spacing.xs, lineHeight: 1 }}>{value}</Text>
      <Text as="div" variant="caption" color="var(--pui-text-secondary)" style={{ marginTop: theme.spacing.xs }}>{label}</Text>
    </div>
  );
}

// Every empty state in the app is this one component: illustration, a short
// explanation, and up to two actions (primary filled, secondary ghost).
// Actions are optional — pass only what applies — but the shape is always
// available so no page ever falls back to a bare "Coming Soon" label.
// `actions` accepts a flat list (1-3) for pages that need more than the old
// primary/secondary pair — e.g. an empty section with "Create X / Import X /
// Use existing X" — the first renders filled, the rest as the same ghost
// style secondaryAction already used everywhere. Passing primaryAction /
// secondaryAction directly still works exactly as before for every existing
// call site; `actions` is just a third option that reuses the same two
// button styles instead of introducing a new one.
// Every empty state shares one shape: a raised illustration "puck" (a
// placeholder slot today, ready for real artwork later without a redesign),
// a short explanation, and up to two physical actions — a primary button
// people can press, and a lighter ghost fallback. Nothing here reads as
// leftover white space.
function EmptyState({ icon: Icon, title, subtitle, primaryAction, secondaryAction, actions }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const resolvedActions = actions && actions.length > 0
    ? actions
    : [primaryAction, secondaryAction].filter(Boolean);

  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        padding: `${theme.spacing["2xl"]}px ${theme.spacing.lg}px`,
        background: c.background,
        borderRadius: theme.radius.lg,
        border: `1.5px dashed ${c.border}`,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: theme.radius.lg,
          background: `linear-gradient(180deg, ${lighten(c.card, 0.02)}, ${c.card})`,
          border: `1px solid ${c.border}`,
          boxShadow: `${theme.shadows.low}, 0 3px 0 0 ${darken(c.border, 0.08)}`,
          marginBottom: theme.spacing.md,
        }}
      >
        <Icon size={20} style={{ color: c.muted }} />
      </div>
      <Text variant="title" color={c.textPrimary}>{title}</Text>
      {subtitle && (
        <Text as="div" variant="caption" color={c.muted} style={{ marginTop: theme.spacing.xs, maxWidth: 240, lineHeight: 1.5 }}>
          {subtitle}
        </Text>
      )}
      {resolvedActions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap justify-center" style={{ marginTop: theme.spacing.lg }}>
          {resolvedActions.map((a, i) => (
            <Button key={a.label} variant={i === 0 ? "primary" : "ghost"} size="sm" onClick={a.onClick}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// Section 4 — Loading States: a shimmering placeholder bar, sized per
// call site (a title-width bar reads differently than a full paragraph
// line), used to build up skeleton versions of ItemCard/GridItemCard so a
// list "loading" looks like a dimmed preview of its own real shape rather
// than a generic spinner. Shimmer is a CSS background-position sweep
// (cheap, GPU-friendly) and turns into a static gray block automatically
// under reduced motion via the .pui-reduced-motion blanket rule.
function SkeletonBar({ width = "100%", height = 12, radius = 6, style }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div
      style={{
        width, height, borderRadius: radius,
        background: `linear-gradient(90deg, ${c.border} 25%, ${withAlpha(c.disabled, 0.35)} 37%, ${c.border} 63%)`,
        backgroundSize: "200% 100%",
        animation: theme.reducedMotion ? "none" : "pui-shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// One skeleton shaped like ItemCard (icon tile + title + meta line), and a
// list of them — the loading stand-in for any page's main list while its
// "data" is still arriving.
function ItemCardSkeleton() {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div className="flex items-center" style={{ gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.lg, border: `1px solid ${c.border}`, background: c.card }}>
      <SkeletonBar width={36} height={36} radius={theme.radius.md} style={{ flexShrink: 0 }} />
      <div className="flex-1 min-w-0" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <SkeletonBar width="60%" height={13} />
        <SkeletonBar width="35%" height={10} />
      </div>
    </div>
  );
}

function ListSkeleton({ count = 4 }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.sm }}>
      {Array.from({ length: count }, (_, i) => <ItemCardSkeleton key={i} />)}
    </div>
  );
}

// Brief, deliberately short "loading" window so a page's skeleton is felt
// rather than stared at — real network latency would drive this in a
// non-prototype build; here it just proves the loading→content path is
// smooth instead of an instant swap or (worse) a spinner.
function useBriefLoading(ms = 500) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

// Section 7 — Error Feedback: same shape as EmptyState (icon, message,
// one action) but the action is always a retry, and the message always
// explains + suggests a fix rather than surfacing a raw error string.
function ErrorState({ title = "Couldn't load this", subtitle = "Check your connection and try again.", onRetry }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        padding: `${theme.spacing["2xl"]}px ${theme.spacing.lg}px`,
        background: c.background,
        borderRadius: theme.radius.lg,
        border: `1.5px dashed ${c.border}`,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 48, height: 48, borderRadius: theme.radius.lg,
          background: `linear-gradient(180deg, ${lighten(c.card, 0.02)}, ${c.card})`,
          border: `1px solid ${c.border}`,
          boxShadow: `${theme.shadows.low}, 0 3px 0 0 ${darken(c.border, 0.08)}`,
          marginBottom: theme.spacing.md,
        }}
      >
        <Zap size={20} style={{ color: c.danger }} />
      </div>
      <Text variant="title" color={c.textPrimary}>{title}</Text>
      <Text as="div" variant="caption" color={c.muted} style={{ marginTop: theme.spacing.xs, maxWidth: 240, lineHeight: 1.5 }}>
        {subtitle}
      </Text>
      {onRetry && (
        <div style={{ marginTop: theme.spacing.lg }}>
          <Button variant="primary" size="sm" onClick={onRetry}>Retry</Button>
        </div>
      )}
    </div>
  );
}

// A tappable placeholder tile for grids of categories — Learning Materials,
// Saved Library groups, Create menu entries, Preset types. One component
// instead of four near-identical grids.
function CategoryCard({ icon: Icon, label, meta, onClick }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.surfaceText.card;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2.5 pui-lift hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-left"
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        boxShadow: theme.shadows.low,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        // Prompt 11B.2 — this card paints the real `card` surface, so it
        // needs its own scoped contrast the same as Card/ItemCard/etc —
        // otherwise the label/meta below would keep using the app-wide
        // text color even when Card Color makes `card` diverge from it.
        ...surfaceVars(t),
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 36, height: 36, borderRadius: theme.radius.md, background: c.background }}
      >
        <Icon size={16} style={{ color: theme.surfaceText.background.textSecondary }} />
      </div>
      <div className="min-w-0 w-full">
        <Text as="div" variant="body" weight={600} className="truncate">{label}</Text>
        {meta && <Text as="div" variant="caption" color="var(--pui-text-muted)" className="truncate" style={{ marginTop: 2 }}>{meta}</Text>}
      </div>
    </button>
  );
}

// Horizontal scrolling chip row — deck/quiz filters, difficulty, grouping,
// anything that's a set of mutually-visible toggle-ish options. Thin
// wrapper around ThemedChip so filter chips everywhere share the exact same
// "select and rise" physical behavior as the rest of the app.
function ChipRow({ items, active, onSelect }) {
  const { theme } = useTheme();
  return (
    <div
      className="flex items-center overflow-x-auto pb-1 -mx-4 px-4 pui-scroll pui-edge-fade-x [&::-webkit-scrollbar]:hidden"
      style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}
    >
      {items.map((label) => (
        <ThemedChip key={label} label={label} active={active === label} onClick={() => onSelect && onSelect(label)} />
      ))}
    </div>
  );
}

// Shared list-page toolbar: search / sort / filter / group / grid-list
// toggle / selection mode. Every icon is a placeholder trigger — no page
// wires the underlying behavior, but the affordance is present everywhere
// a "major list" appears, per the navigation spec.
//
// Each control is individually toggle-able via props (all default to true,
// matching every existing call site's appearance exactly) so a future page
// can enable only the controls it actually needs instead of duplicating
// this markup with pieces removed by hand.
// Sort / Filter / Layout / Selection Mode, grouped behind the toolbar's
// single overflow trigger instead of sitting as four separate icons next to
// Search. Same visual language as ContextMenuSheet (a BottomSheet list of
// icon + label rows) so the app isn't introducing a second "menu" style.
function ToolbarOptionsSheet({
  open, onClose, view, onToggleView, selectionMode, onToggleSelection,
  showSort, showFilter, showView, showSelection,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const rowStyle = { display: "flex", alignItems: "center", gap: theme.spacing.md, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, borderRadius: theme.radius.md, textAlign: "left" };
  return (
    <BottomSheet open={open} onClose={onClose} title="View Options">
      <div className="flex flex-col -mx-1">
        {showSort && (
          <button onClick={onClose} className="pui-lift active:scale-[0.98]" style={rowStyle}>
            <ArrowUpDown size={16} style={{ color: c.muted }} />
            <Text variant="body" color={c.textPrimary}>Sort</Text>
          </button>
        )}
        {showFilter && (
          <button onClick={onClose} className="pui-lift active:scale-[0.98]" style={rowStyle}>
            <SlidersHorizontal size={16} style={{ color: c.muted }} />
            <Text variant="body" color={c.textPrimary}>Filter</Text>
          </button>
        )}
        {showView && (
          <button onClick={() => { onToggleView && onToggleView(); onClose(); }} className="pui-lift active:scale-[0.98]" style={rowStyle}>
            {view === "list" ? <LayoutGrid size={16} style={{ color: c.muted }} /> : <List size={16} style={{ color: c.muted }} />}
            <Text variant="body" color={c.textPrimary}>{view === "list" ? "Switch to Grid" : "Switch to List"}</Text>
          </button>
        )}
        {showSelection && (
          <button onClick={() => { onToggleSelection && onToggleSelection(); onClose(); }} className="pui-lift active:scale-[0.98]" style={rowStyle}>
            <CheckSquare size={16} style={{ color: selectionMode ? c.primary : c.muted }} />
            <Text variant="body" color={c.textPrimary}>{selectionMode ? "Exit Selection Mode" : "Selection Mode"}</Text>
          </button>
        )}
      </div>
    </BottomSheet>
  );
}

function Toolbar({
  view,
  onToggleView,
  selectionMode,
  onToggleSelection,
  onSearchClick,
  showSearch = true,
  showSort = true,
  showFilter = true,
  showView = true,
  showSelection = true,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [optionsOpen, setOptionsOpen] = useState(false);
  const hasOptions = showSort || showFilter || showView || showSelection;

  return (
    <div className="flex items-center" style={{ gap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
      {showSearch && (
        <button
          onClick={onSearchClick}
          className="flex-1 flex items-center pui-lift"
          style={{
            gap: theme.spacing.xs,
            color: c.muted,
            background: c.background,
            border: `1px solid ${c.border}`,
            borderRadius: theme.radius.pill,
            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
            fontSize: theme.typography.caption.size,
          }}
        >
          <Search size={13} />
          Search
        </button>
      )}
      {hasOptions && (
        <button
          aria-label="View options"
          onClick={() => setOptionsOpen(true)}
          className="pui-press"
          style={{
            padding: theme.spacing.sm,
            borderRadius: theme.radius.pill,
            color: selectionMode ? c.onAccent : c.textSecondary,
            background: selectionMode ? c.primary : c.card,
            border: `1px solid ${selectionMode ? c.primary : c.border}`,
            "--pui-depth": "2px",
            "--pui-depth-color": selectionMode ? darken(c.primary, 0.18) : darken(c.border, 0.1),
          }}
        >
          <SlidersHorizontal size={14} />
        </button>
      )}
      <ToolbarOptionsSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        view={view}
        onToggleView={onToggleView}
        selectionMode={selectionMode}
        onToggleSelection={onToggleSelection}
        showSort={showSort}
        showFilter={showFilter}
        showView={showView}
        showSelection={showSelection}
      />
    </div>
  );
}

// Back-compat alias — every existing call site was written against this
// name; kept so migrating pages to the new configurable component didn't
// require touching every call site in the same pass.
const ListToolbar = Toolbar;

// Per-item overflow menu — Rename / Duplicate / Move / Archive / Favorite /
// Pin / Delete / Share / Properties. One sheet, reused from every list item
// across Notes, Flashcard decks, Courses, and Saved items.
const CONTEXT_MENU_ACTIONS = [
  { label: "Rename", icon: Edit3 },
  { label: "Duplicate", icon: Copy },
  { label: "Move", icon: FolderTree },
  { label: "Favorite", icon: Star },
  { label: "Pin", icon: Pin },
  { label: "Archive", icon: Archive },
  { label: "Share", icon: Share2 },
  { label: "Properties", icon: Info },
  { label: "Delete", icon: Trash2, danger: true },
];

function ItemMenuButton({ onOpen }) {
  const { theme } = useTheme();
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpen(); }}
      aria-label="More actions"
      className="pui-lift active:scale-90 shrink-0"
      style={{ padding: theme.spacing.xs, margin: -theme.spacing.xs, borderRadius: theme.radius.pill, color: theme.colors.textSecondary }}
    >
      <MoreVertical size={16} />
    </button>
  );
}

// Maps a menu action label to the metadata flag it toggles. Actions not
// listed here (Rename, Duplicate, Move, Share, Properties, Delete) stay
// exactly as they were — this refactor is scoped to the saved-system
// actions, not to giving every menu item real behavior.
const CONTEXT_MENU_FLAG_ACTIONS = {
  Favorite: "favorite",
  Pin: "pinned",
  Archive: "archived",
};

// `entity` identifies what this sheet is acting on — {type, id, label,
// icon, meta}. It's optional (and `itemLabel` alone still works, as every
// call site used to look) so a sheet can be opened for something that
// isn't a saved-system entity yet without crashing; in that case
// Favorite/Pin/Archive simply close the sheet like every other action did
// before this refactor.
//
// `available`, when passed, restricts the sheet to just those action labels
// (any order) — anything not in the list is hidden rather than rendered
// disabled, per "hide unavailable actions automatically." Omitting it (the
// default, and every existing call site today) shows the full action set,
// so no current page's appearance changes.
function ContextMenuSheet({ itemLabel, entity, onClose, actions = CONTEXT_MENU_ACTIONS, available }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { show } = useToast();
  const visibleActions = available ? actions.filter((a) => available.includes(a.label)) : actions;
  const safeEntity = entity || (itemLabel ? { type: "generic", id: itemLabel, label: itemLabel } : null);
  const flags = useEntityFlags(
    safeEntity?.type ?? "generic",
    safeEntity?.id ?? "__none__",
    safeEntity ? { label: safeEntity.label, icon: safeEntity.icon, meta: safeEntity.meta } : undefined
  );
  // Delete is the one destructive, irreversible action in this menu — it
  // gets a confirmation step (Section 13) instead of firing immediately
  // like every other item here. Share is instant but still worth a small
  // "it happened" acknowledgement (Section 6), since there's no other
  // feedback that the tap registered.
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <>
      <BottomSheet open={!!itemLabel && !confirmingDelete} onClose={onClose} title={itemLabel || ""}>
        <div className="flex flex-col -mx-1">
          {visibleActions.map((a) => {
            const flag = CONTEXT_MENU_FLAG_ACTIONS[a.label];
            const isOn = flag ? !!flags[flag] : false;
            const iconColor = a.danger ? c.danger : isOn ? c.primary : c.muted;
            return (
              <button
                key={a.label}
                onClick={() => {
                  if (a.label === "Delete") { setConfirmingDelete(true); return; }
                  if (flag && safeEntity) {
                    flags.set(flag, !isOn);
                  }
                  if (a.label === "Share") show(`Link copied for "${itemLabel}"`);
                  onClose();
                }}
                className="flex items-center pui-lift active:scale-[0.98] text-left"
                style={{
                  gap: theme.spacing.md,
                  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                  borderRadius: theme.radius.md,
                }}
              >
                <a.icon size={16} style={{ color: iconColor, fill: isOn && !a.danger ? withAlpha(c.primary, 0.15) : "none" }} />
                <Text variant="body" color={a.danger ? c.danger : c.textPrimary}>
                  {isOn ? `Un${a.label.charAt(0).toLowerCase()}${a.label.slice(1)}` : a.label}
                </Text>
              </button>
            );
          })}
        </div>
      </BottomSheet>
      <ConfirmSheet
        open={confirmingDelete}
        onClose={() => { setConfirmingDelete(false); onClose(); }}
        onConfirm={() => show(`"${itemLabel}" deleted`, "danger")}
        title={`Delete "${itemLabel}"?`}
        message="This can't be undone."
        confirmLabel="Delete"
      />
    </>
  );
}

/* ------------------------------------------------------------
   REUSABLE ITEM CARD
   Course / Folder / Deck / Quiz / Flashcard / Topic / Saved Item /
   Collection rows were all the same bordered white row — icon tile,
   title, a line of meta, an optional progress bar, an optional
   trailing badge/score, an optional chevron, an optional overflow
   menu — with only those pieces differing per page. One component,
   configured per usage, instead of one hand-rolled `<button>` per
   list.
   `subtitle` accepts either plain text (rendered in the default meta
   style, overridable via `subtitleClass`) or a fully custom node
   (e.g. Notes' folder-tag + timestamp row) — passing a node renders
   it verbatim so bespoke meta layouts aren't forced through a single
   text style.
   ------------------------------------------------------------ */
function ItemCard({
  icon: Icon,
  iconSize = 18,
  iconBoxClass = "w-11 h-11 rounded-xl",
  align = "center", // "center" | "start"
  title,
  titleClass = "text-sm font-semibold truncate",
  subtitle,
  subtitleClass = "text-xs mt-0.5",
  progress, // 0-100, renders a ProgressBar under the subtitle when provided
  badges, // optional array of {label, tone: "accent" | "neutral"} rendered inline under the title
  trailing, // custom node (badge, due count, score, percentage+chevron, ...)
  chevron = false,
  onMenuOpen, // renders ItemMenuButton when provided
  onClick,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.surfaceText.card;
  // Same subtle "molded surface" treatment as the Card primitive: a faint
  // top-to-bottom gradient plus a soft inset highlight/shade, rather than a
  // single flat fill. This is the most-repeated surface in the app (every
  // Recent list, deck, course, note row), so this one change carries most
  // of the visible "premium" lift across pages that already use ItemCard.
  const face = `linear-gradient(180deg, ${lighten(c.card, 0.012)}, ${c.card})`;
  const glow = `inset 0 1px 0 ${withAlpha("#FFFFFF", theme.isDark ? 0.03 : 0.5)}, inset 0 -1px 0 ${withAlpha(c.textPrimary, 0.025)}`;
  return (
    <button
      onClick={onClick}
      className={`flex ${align === "start" ? "items-start" : "items-center"} pui-lift hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] text-left w-full`}
      style={{
        gap: theme.spacing.md,
        background: face,
        border: `1px solid ${c.border}`,
        boxShadow: `${theme.shadows.low}, ${glow}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        // Prompt 11A — scoped to this card's own resolved surface, so
        // title/subtitle/icon/badge text below (and anything a caller
        // passes into `trailing`/`subtitle`) stays readable automatically,
        // even if a future Card Color override makes `card` diverge from
        // the app's overall Light/Dark mode.
        ...surfaceVars(t),
      }}
    >
      {Icon && (
        <div
          className={`${iconBoxClass} flex items-center justify-center shrink-0 ${align === "start" ? "mt-0.5" : ""}`}
          style={{ background: c.background }}
        >
          <Icon size={iconSize} style={{ color: theme.surfaceText.background.textSecondary }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={titleClass} style={{ color: "var(--pui-text-primary)" }}>{title}</div>
        {typeof subtitle === "string" ? <div className={subtitleClass} style={{ color: "var(--pui-text-muted)" }}>{subtitle}</div> : subtitle}
        {badges && badges.length > 0 && (
          <div className="flex items-center flex-wrap" style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
            {badges.map((b, i) => (
              <span
                key={i}
                className="text-[11px] font-medium rounded-full"
                style={{
                  padding: "2px 8px",
                  ...(b.tone === "accent"
                    ? { color: c.primary, background: withAlpha(c.primary, 0.12) }
                    : { color: "var(--pui-text-secondary)", background: c.background }),
                }}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        {progress !== undefined && <ProgressBar value={progress} className="mt-2.5" />}
      </div>
      {trailing}
      {chevron && <ChevronRight size={16} style={{ color: "var(--pui-text-disabled)" }} className="shrink-0" />}
      {onMenuOpen && <ItemMenuButton onOpen={onMenuOpen} />}
    </button>
  );
}

/* ------------------------------------------------------------
   GRID ITEM CARD
   The grid-mode counterpart to ItemCard. A list row is wide and
   horizontal (icon | text | trailing) — shrinking that same row
   into a narrow grid column is what produced the overlapping
   text, misaligned icons, and collapsed progress bars. This is a
   real vertical layout built for a grid cell instead: icon +
   overflow menu on top, a two-line title/subtitle/percentage in
   the middle, and the progress bar pinned to the bottom. List and
   Grid now swap between two purpose-built layouts instead of one
   layout being resized into the other's space.
   ------------------------------------------------------------ */
function GridItemCard({
  icon: Icon,
  iconSize = 16,
  title,
  subtitle, // plain text or a custom node, same as ItemCard
  progress, // 0-100, renders a % + bottom bar when provided
  badgeText, // short trailing text (e.g. "34 due") shown alongside/instead of progress %
  onMenuOpen,
  onClick,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.surfaceText.card;
  const face = `linear-gradient(180deg, ${lighten(c.card, 0.012)}, ${c.card})`;
  const glow = `inset 0 1px 0 ${withAlpha("#FFFFFF", theme.isDark ? 0.03 : 0.5)}, inset 0 -1px 0 ${withAlpha(c.textPrimary, 0.025)}`;
  return (
    <button
      onClick={onClick}
      className="flex flex-col h-full pui-lift hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] text-left w-full"
      style={{
        background: face,
        border: `1px solid ${c.border}`,
        boxShadow: `${theme.shadows.low}, ${glow}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        ...surfaceVars(t),
      }}
    >
      <div className="flex items-center justify-between">
        {Icon ? (
          <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: theme.radius.md, background: c.background }}>
            <Icon size={iconSize} style={{ color: theme.surfaceText.background.textSecondary }} />
          </div>
        ) : <span />}
        {onMenuOpen && <ItemMenuButton onOpen={onMenuOpen} />}
      </div>

      <div className="flex-1 min-w-0" style={{ marginTop: theme.spacing.sm }}>
        <div
          className="text-sm font-semibold leading-snug"
          style={{ color: "var(--pui-text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {title}
        </div>
        {subtitle && (
          typeof subtitle === "string" ? (
            <div className="text-xs truncate" style={{ color: "var(--pui-text-muted)", marginTop: 4 }}>{subtitle}</div>
          ) : (
            subtitle
          )
        )}
      </div>

      {(progress !== undefined || badgeText) && (
        <div className="flex items-center justify-between" style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
          <span className="text-[11px] font-medium truncate" style={{ color: "var(--pui-text-muted)" }}>{badgeText}</span>
          {progress !== undefined && (
            <span className="text-xs font-semibold shrink-0" style={{ color: "var(--pui-text-primary)" }}>{progress}%</span>
          )}
        </div>
      )}
      {progress !== undefined && <ProgressBar value={progress} className="mt-1.5" />}
    </button>
  );
}

/* ---------------- Courses ---------------- */

const SAMPLE_COURSES = [
  { id: 1, name: "Pharmacology", meta: "12 lessons · 4 modules", progress: 68 },
  { id: 2, name: "Anatomy & Physiology", meta: "20 lessons · 6 modules", progress: 42 },
  { id: 3, name: "Biochemistry", meta: "9 lessons · 3 modules", progress: 91 },
  { id: 4, name: "Microbiology", meta: "15 lessons · 5 modules", progress: 12 },
];

const COURSE_QUICK_ACTIONS = [
  { label: "Continue Studying", icon: Play },
  { label: "Browse Catalog", icon: Globe },
];

function CoursesPage({ onOpenCourse = () => {} }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [view, setView] = useState("list");
  const [menuFor, setMenuFor] = useState(null);
  const loading = useBriefLoading();

  return (
    <PageLayout
      header={{
        title: "Your Courses",
        subtitle: `${SAMPLE_COURSES.length} in progress`,
        actions: (
          <Button variant="primary" size="sm" icon={Plus} className="!rounded-full">
            Add Course
          </Button>
        ),
      }}
      hero={
        <div className="grid grid-cols-2 gap-2 mt-4">
          {COURSE_QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              className="flex flex-col items-center gap-1.5 rounded-xl py-3 text-center pui-lift active:scale-[0.98] transition-all duration-150"
              style={{ background: c.card, border: `1px solid ${c.border}` }}
            >
              <a.icon size={15} style={{ color: c.textSecondary }} />
              <span className="text-[10px] font-medium leading-tight px-1" style={{ color: c.textSecondary }}>{a.label}</span>
            </button>
          ))}
        </div>
      }
      toolbar={
        <>
          <SectionHeading>In Progress</SectionHeading>
          <Toolbar view={view} onToggleView={() => setView((v) => (v === "list" ? "grid" : "list"))} />
        </>
      }
    >
      <div className={`mt-3 ${view === "grid" ? "grid grid-cols-2 gap-2.5 items-stretch" : "flex flex-col gap-2.5"}`}>
        {loading ? (
          <ListSkeleton count={view === "grid" ? 4 : 3} />
        ) : (
          SAMPLE_COURSES.map((c) =>
          view === "grid" ? (
            <GridItemCard
              key={c.id}
              onClick={() => onOpenCourse(c.name)}
              icon={GraduationCap}
              title={c.name}
              subtitle={c.meta}
              progress={c.progress}
              onMenuOpen={() => setMenuFor({ type: "course", id: c.id, label: c.name, icon: GraduationCap, meta: c.meta })}
            />
          ) : (
            <ItemCard
              key={c.id}
              onClick={() => onOpenCourse(c.name)}
              icon={GraduationCap}
              title={c.name}
              subtitle={c.meta}
              progress={c.progress}
              trailing={
                <div className="flex flex-col items-end shrink-0 ml-1">
                  <span className="text-xs font-medium" style={{ color: theme.colors.textSecondary }}>{c.progress}%</span>
                  <ChevronRight size={16} className="mt-1.5" style={{ color: theme.colors.disabled }} />
                </div>
              }
              onMenuOpen={() => setMenuFor({ type: "course", id: c.id, label: c.name, icon: GraduationCap, meta: c.meta })}
            />
          )
        ))}
      </div>

      <SectionHeading>Pinned</SectionHeading>
      <EntityFlagSection
        flag="pinned"
        types={["course"]}
        icon={Pin}
        title="Nothing pinned yet"
        subtitle="Pin a course from its menu to keep it here for quick access."
        onOpenEntity={onOpenCourse}
      />

      <SectionHeading>Browse</SectionHeading>
      <EmptyState
        icon={Folder}
        title="Explore the full catalog"
        subtitle="Course browsing isn't wired up yet — this is a placeholder for what it'll look like."
        actions={[
          { label: "Create Course", onClick: () => {} },
          { label: "Browse Catalog", onClick: () => {} },
        ]}
      />

      <ContextMenuSheet itemLabel={menuFor?.label} entity={menuFor} onClose={() => setMenuFor(null)} />
    </PageLayout>
  );
}

/* ---------------- Notes ---------------- */

const SAMPLE_NOTES = [
  { id: 1, title: "Beta blockers — mechanism", folder: "Pharmacology", time: "2h ago" },
  { id: 2, title: "Cranial nerve mnemonics", folder: "Anatomy", time: "Yesterday" },
  { id: 3, title: "Krebs cycle summary", folder: "Biochemistry", time: "2 days ago" },
];

const NOTE_FOLDERS = [
  { label: "Pharmacology", icon: Folder, meta: "12 notes" },
  { label: "Anatomy", icon: Folder, meta: "8 notes" },
  { label: "Biochemistry", icon: Folder, meta: "5 notes" },
  { label: "Collections", icon: FolderTree, meta: "3 collections" },
];

const NOTE_QUICK_LINKS = [
  { label: "Templates", icon: FileBadge2 },
  { label: "Favorites", icon: Star },
  { label: "Pinned", icon: Pin },
  { label: "Tags", icon: Tag },
  { label: "Archived", icon: Archive },
];

function NotesPage({ onOpenFolder = () => {}, onEditNote = () => {} }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [view, setView] = useState("list");
  const [menuFor, setMenuFor] = useState(null);
  const loading = useBriefLoading();

  return (
    <PageLayout
      header={{
        title: "Notes",
        actions: (
          <Button variant="primary" size="sm" icon={Plus} className="!rounded-full">
            New Note
          </Button>
        ),
      }}
      categories={
        <>
          <SectionHeading>Folders</SectionHeading>
          <div className="grid grid-cols-2 gap-2.5">
            {NOTE_FOLDERS.map((f) => (
              <CategoryCard key={f.label} icon={f.icon} label={f.label} meta={f.meta} onClick={() => onOpenFolder(f.label)} />
            ))}
          </div>
        </>
      }
      toolbar={
        <>
          <ChipRow items={NOTE_QUICK_LINKS.map((n) => n.label)} onSelect={() => {}} />
          <SectionHeading>Recent</SectionHeading>
          <Toolbar view={view} onToggleView={() => setView((v) => (v === "list" ? "grid" : "list"))} />
        </>
      }
    >
      <div className="mt-3">
        {loading ? (
          <div className="flex gap-2.5">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} style={{ width: view === "grid" ? 200 : 280 }}><ItemCardSkeleton /></div>
            ))}
          </div>
        ) : (
        // A single row of individual note cards reads correctly as one
        // row — the previous 2-row grid (RecentRow) left orphaned cells
        // whenever the count wasn't a clean multiple of 2, which is what
        // produced the uneven vertical alignment, clipped-looking gaps,
        // and inconsistent spacing. `shrink-0` on every card wrapper
        // keeps each card at its intended width instead of being
        // squeezed (and its content overflowing) by flex's default
        // shrink behavior in a scrollable row.
        <HorizontalCarousel scrollKey={`notes-recent-${view}`} rows={1}>
          {SAMPLE_NOTES.map((n) =>
            view === "grid" ? (
              <div key={n.id} className="shrink-0 self-center" style={{ width: 200, scrollSnapAlign: "start" }}>
                <GridItemCard
                  onClick={() => onEditNote(n)}
                  icon={FileText}
                  iconSize={16}
                  title={n.title}
                  subtitle={
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[11px] font-medium rounded-full px-2 py-0.5" style={{ color: "var(--pui-text-secondary)", background: c.surface }}>
                        {n.folder}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--pui-text-muted)" }}>{n.time}</span>
                    </div>
                  }
                  onMenuOpen={() => setMenuFor({ type: "note", id: n.id, label: n.title, icon: FileText, meta: n.folder })}
                />
              </div>
            ) : (
              <div key={n.id} className="shrink-0 self-center" style={{ width: 280, scrollSnapAlign: "start" }}>
                <ItemCard
                  onClick={() => onEditNote(n)}
                  icon={FileText}
                  iconSize={16}
                  iconBoxClass="w-9 h-9 rounded-lg"
                  align="start"
                  title={n.title}
                  titleClass="text-sm font-medium truncate"
                  subtitle={
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[11px] font-medium rounded-full px-2 py-0.5" style={{ color: "var(--pui-text-secondary)", background: c.surface }}>
                        {n.folder}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--pui-text-muted)" }}>{n.time}</span>
                    </div>
                  }
                  onMenuOpen={() => setMenuFor({ type: "note", id: n.id, label: n.title, icon: FileText, meta: n.folder })}
                />
              </div>
            )
          )}
        </HorizontalCarousel>
        )}
      </div>

      <SectionHeading>Starred</SectionHeading>
      <EntityFlagSection
        flag="favorite"
        types={["note"]}
        icon={Star}
        title="No starred notes yet"
        subtitle="Star a note to pin it here for quick access."
        emptyActions={[
          { label: "Create Note", onClick: () => {} },
          { label: "Import Notes", onClick: () => {} },
          { label: "Use Template", onClick: () => {} },
        ]}
        onOpenEntity={onOpenFolder}
      />

      <ContextMenuSheet itemLabel={menuFor?.label} entity={menuFor} onClose={() => setMenuFor(null)} />
    </PageLayout>
  );
}

/* ---------------- Notes Folder (file-explorer view) ----------------
   What opening a Notes folder actually shows. A Notes folder is not a
   Course — there is no Overview/Lessons/Flashcards/Quiz/Progress here,
   just the folder's own notes, exactly like opening a folder in a file
   manager: New Note, Search, then note cards — or, if the folder is
   empty, a single bordered empty state. Built entirely from existing
   shared primitives (PageHeader, Button, ThemedInput, ItemCard,
   EmptyState, ContextMenuSheet) — nothing new introduced. */

function NotesFolderPage({ folderLabel, notes, onNewNote, onOpenNote }) {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [menuFor, setMenuFor] = useState(null);
  const isEmpty = notes.length === 0;
  const filtered = query.trim()
    ? notes.filter((n) => n.title.toLowerCase().includes(query.trim().toLowerCase()))
    : notes;

  // The one Add button for this folder — lives in the header, same slot
  // every other page (Courses, Notes' own top page) already uses for its
  // "+" action, so an empty folder isn't a special case visually.
  const addButton = (
    <Button variant="primary" size="sm" icon={Plus} className="!rounded-full" onClick={onNewNote}>
      New Note
    </Button>
  );

  if (isEmpty) {
    // Exactly the required four things: page title, folder name (the same
    // title, since a folder page IS titled by its folder), the Add
    // button, and one bordered empty state — nothing else.
    return (
      <div className="px-4 pt-4 pb-10">
        <PageHeader title={folderLabel} actions={addButton} />
        <div style={{ marginTop: theme.spacing.xl }}>
          <EmptyState
            icon={FolderPlus}
            title="This folder is empty"
            subtitle={`Notes you add to ${folderLabel} will show up here.`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-10">
      <PageHeader title={folderLabel} subtitle={`${notes.length} note${notes.length === 1 ? "" : "s"}`} actions={addButton} />

      <div style={{ marginTop: theme.spacing.md }}>
        <ThemedInput icon={Search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" />
      </div>

      <div className="flex flex-col gap-2.5" style={{ marginTop: theme.spacing.lg }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Search} title="No matching notes" subtitle="Try a different search term." />
        ) : (
          filtered.map((n) => (
            <ItemCard
              key={n.id}
              onClick={() => onOpenNote(n)}
              icon={FileText}
              iconSize={16}
              iconBoxClass="w-9 h-9 rounded-lg"
              align="start"
              title={n.title}
              titleClass="text-sm font-medium truncate"
              subtitle={n.time}
              onMenuOpen={() => setMenuFor({ type: "note", id: n.id, label: n.title, icon: FileText, meta: n.folder })}
            />
          ))
        )}
      </div>

      <ContextMenuSheet itemLabel={menuFor?.label} entity={menuFor} onClose={() => setMenuFor(null)} />
    </div>
  );
}

/* ---------------- Note Editor (Phase 2 — UI only, no backend) ----------------
   Reuses the shared theme, Text, ContextMenuSheet, and the real entity-flag
   system (useEntityFlags) already powering Favorite/Pin/Archive elsewhere.
   Title/content fields use local component state purely for the input to be
   interactive on screen — nothing here is written to any store, and it does
   not persist. Persistence is explicitly out of scope for this phase. */

function NoteEditorPage({ note, onBack }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { show } = useToast();

  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState("");

  const flags = useEntityFlags("note", note?.id ?? "__none__", {
    label: note?.title,
    icon: FileText,
    meta: note?.folder,
  });

  const handleUnimplemented = (label) => show(`${label} isn't available yet`);

  return (
    <div className="px-4 pt-2 pb-24 flex-1 overflow-y-auto pui-scroll">
      <div className="flex items-center gap-1.5 mb-3">
        <Folder size={13} style={{ color: c.textMuted }} />
        <Text variant="caption" color={c.textMuted}>{note?.folder || "No folder"}</Text>
        <span style={{ color: c.textMuted }}>·</span>
        <Text variant="caption" color={c.textMuted}>Edited {note?.time || "just now"}</Text>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled note"
        className="w-full bg-transparent outline-none mb-3"
        style={{
          fontFamily: "var(--font-family)",
          fontSize: `${theme.typography.heading.size}px`,
          fontWeight: 600,
          color: "var(--pui-text-primary)",
        }}
      />

      <div className="flex items-center gap-2 mb-4">
        <StatusChip active={flags.favorite} icon={Star} label="Favorite" onClick={flags.toggleFavorite} c={c} theme={theme} />
        <StatusChip active={flags.pinned} icon={Pin} label="Pinned" onClick={flags.togglePinned} c={c} theme={theme} />
        <StatusChip active={flags.archived} icon={Archive} label="Archived" onClick={flags.toggleArchived} c={c} theme={theme} />
      </div>

      <div className="flex items-center gap-1 mb-3 pb-3" style={{ borderBottom: `1px solid ${c.border}` }}>
        {[
          { icon: Type, label: "Formatting" },
          { icon: ListChecks, label: "Checklist" },
          { icon: Image, label: "Insert image" },
          { icon: Link2, label: "Insert link" },
        ].map((tool) => (
          <button
            key={tool.label}
            onClick={() => handleUnimplemented(tool.label)}
            className="pui-lift active:scale-90"
            style={{ padding: theme.spacing.sm, borderRadius: theme.radius.md, color: c.textSecondary }}
            aria-label={tool.label}
          >
            <tool.icon size={17} />
          </button>
        ))}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing..."
        rows={10}
        className="w-full bg-transparent outline-none resize-none"
        style={{
          fontFamily: "var(--font-family)",
          fontSize: `${theme.typography.body.size}px`,
          lineHeight: theme.typography.body.lineHeight,
          color: "var(--pui-text-primary)",
        }}
      />

      <div className="mt-6">
        <SectionHeading>Tags</SectionHeading>
        <button
          onClick={() => handleUnimplemented("Tags")}
          className="flex items-center gap-1.5 pui-lift active:scale-[0.98]"
          style={{
            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
            borderRadius: theme.radius.pill,
            border: `1px dashed ${c.border}`,
            color: c.textMuted,
            marginTop: theme.spacing.sm,
          }}
        >
          <Tag size={13} />
          <Text variant="caption" color={c.textMuted}>Add tag</Text>
        </button>
      </div>

      <div className="mt-5">
        <SectionHeading>Attachments</SectionHeading>
        <button
          onClick={() => handleUnimplemented("Attachments")}
          className="flex items-center gap-1.5 pui-lift active:scale-[0.98]"
          style={{
            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
            borderRadius: theme.radius.pill,
            border: `1px dashed ${c.border}`,
            color: c.textMuted,
            marginTop: theme.spacing.sm,
          }}
        >
          <Paperclip size={13} />
          <Text variant="caption" color={c.textMuted}>Add attachment</Text>
        </button>
      </div>
    </div>
  );
}

// New — genuinely required. No existing component renders a labeled,
// toggleable status row like this (existing patterns show one flag icon
// inside a card, not three side by side with labels).
function StatusChip({ active, icon: IconCmp, label, onClick, c, theme }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 pui-lift active:scale-[0.97]"
      style={{
        padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
        borderRadius: theme.radius.pill,
        background: active ? withAlpha(c.primary, 0.12) : "transparent",
        border: `1px solid ${active ? c.primary : c.border}`,
        color: active ? c.primary : c.textSecondary,
      }}
    >
      <IconCmp size={12} fill={active ? withAlpha(c.primary, 0.2) : "none"} />
      <Text variant="caption" color={active ? c.primary : c.textSecondary}>{label}</Text>
    </button>
  );
}

/* ---------------- Study (Flashcards + Quizzes + Ice Breakers) ---------------- */

const SAMPLE_DECKS = [
  { id: 1, name: "Cardiology", due: 34, total: 120 },
  { id: 2, name: "Pharmacology", due: 58, total: 210 },
  { id: 3, name: "Anatomy", due: 12, total: 96 },
  { id: 4, name: "Biochemistry", due: 19, total: 88 },
];

const DECK_CATEGORIES = [
  "Manual Decks", "Generated Decks", "Saved Decks", "Pinned Decks",
  "Favorite Decks", "Recent Decks", "Archived Decks", "Shared Decks",
];

const QUIZ_SHORTCUTS = [
  { label: "Practice Quiz", icon: Play },
  { label: "Review Quiz", icon: Clock },
  { label: "Ice Breaker Quiz", icon: Flame },
  { label: "Custom Quiz", icon: SlidersHorizontal },
  { label: "Saved Quizzes", icon: Star },
  { label: "Pinned Quizzes", icon: Pin },
  { label: "Recent Quizzes", icon: Clock },
];

const SAVED_STUDY_GROUPS = [
  { label: "Saved Decks", icon: Bookmark },
  { label: "Saved Quizzes", icon: ListChecks },
  { label: "Saved Ice Breakers", icon: Flame },
];

// Every active-recall mode the app supports, in one table — the same shape
// the widget/size registries use elsewhere. `active: true` modes are real
// destinations today (selectable in the shared study flow below); the rest
// are architecture only, rendered as disabled placeholders in the Study
// page's "More Ways to Study" section. Adding a real mode later means
// flipping one flag here, not redesigning the flow or the page.
const STUDY_MODE_REGISTRY = [
  { id: "flashcards", label: "Flashcards", icon: Bookmark, active: true },
  { id: "quiz", label: "Quiz", icon: ListChecks, active: true },
  { id: "iceBreaker", label: "Ice Breaker", icon: Flame, active: true },
  { id: "practiceTest", label: "Practice Test", icon: FileBadge2, active: false },
  { id: "timedChallenge", label: "Timed Challenge", icon: Timer, active: false },
  { id: "adaptiveReview", label: "Adaptive Review", icon: TrendingUp, active: false },
  { id: "spacedRepetition", label: "Spaced Repetition", icon: Clock, active: false },
  { id: "mockExam", label: "Mock Exam", icon: GraduationCap, active: false },
];

// Drives the Study Modes hub at the top of the Study page. Each entry is a
// large module card: emoji + description + a couple of quick stats + a
// primary action label. `getStats` receives a small context object (deck/
// due/quiz-set counts) computed once in StudyPage and returns the chip
// strings to show — kept as a function so stats stay live instead of
// hardcoded numbers. The `id` is also the key StudyPage uses to decide
// which existing section to reveal when the card is opened, so no
// Flashcard/Quiz markup or logic moves or changes — the hub just decides
// what's visible. To add a future mode (Ice Breakers, Matching Game, Fill
// in the Blank, Image Quiz, Rapid Review, Board Exam Mode, ...): add one
// entry here, then add that id's section to StudyPage's content map.
// Nothing about the hub grid itself needs to change.
const STUDY_HUB_MODES = [
  {
    id: "flashcards",
    label: "Flashcards",
    emoji: "🃏",
    icon: Bookmark,
    description: "Review decks with spaced repetition.",
    getStats: (ctx) => [`${ctx.deckCount} decks`, `${ctx.totalDue} due`],
    actionLabel: "Continue",
  },
  {
    id: "quiz",
    label: "Quiz",
    emoji: "❓",
    icon: ListChecks,
    description: "Test yourself with generated and saved quiz sets.",
    getStats: (ctx) => [`${ctx.quizSetCount} quiz sets`],
    actionLabel: "Start",
  },
];

// The shared Study entry point: Course → Subject → Topic → Lesson → Choose
// Study Mode, as one self-contained flow instead of Flashcards and Quizzes
// each inventing their own navigation. Reuses the same card list markup as
// the drill-down explorer so it doesn't invent a second visual language,
// but keeps its own local step state instead of hooking into App's
// drill/back stack — it's a focused picker, not a section to browse around
// in. The mode-choice step reads straight from STUDY_MODE_REGISTRY, so a
// newly-activated mode shows up here automatically.
const STUDY_STEPS = ["Course", "Subject", "Topic", "Lesson"];

function StudyFlowSheet({ open, onClose }) {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState([]);
  const { theme } = useTheme();
  const c = theme.colors;
  const { show } = useToast();

  useEffect(() => {
    if (open) { setStep(0); setPicks([]); }
  }, [open]);

  if (!open) return null;

  const atModePicker = step === STUDY_STEPS.length;
  const atEnd = step > STUDY_STEPS.length;
  const label = STUDY_STEPS[step];
  const options = !atModePicker && !atEnd ? Array.from({ length: 4 }, (_, i) => `${label} ${i + 1}`) : [];
  const activeModes = STUDY_MODE_REGISTRY.filter((m) => m.active);

  const sheetTitle = atEnd ? "Ready to study" : atModePicker ? "Choose Study Mode" : `Choose ${label}`;

  return (
    <BottomSheet open={open} onClose={onClose} title={sheetTitle}>
      {picks.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap text-xs mb-3" style={{ color: c.muted }}>
          {picks.map((p, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={11} style={{ color: c.disabled }} />}
              <span style={i === picks.length - 1 ? { color: c.textPrimary, fontWeight: 500 } : undefined}>{p}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {atEnd ? (
        <div className="text-center py-2">
          <div className="text-sm mb-4" style={{ color: c.textSecondary }}>
            Studying <span className="font-semibold" style={{ color: c.textPrimary }}>{picks[picks.length - 2]}</span> with{" "}
            <span className="font-semibold" style={{ color: c.textPrimary }}>{picks[picks.length - 1]}</span>
          </div>
          <Button
            variant="primary"
            fullWidth
            icon={Play}
            onClick={() => { triggerHaptic("medium", theme.reducedMotion); show("Study session started"); onClose(); }}
          >
            Begin Study
          </Button>
        </div>
      ) : atModePicker ? (
        <div className="flex flex-col gap-2">
          {activeModes.map((m) => (
            <button
              key={m.id}
              onClick={() => { setPicks((p) => [...p, m.label]); setStep((s) => s + 1); }}
              className="flex items-center gap-3 rounded-xl p-3.5 text-left text-sm pui-lift hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150"
              style={{ background: c.card, border: `1px solid ${c.border}`, color: c.textPrimary }}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.surface }}>
                <m.icon size={15} style={{ color: c.textSecondary }} />
              </span>
              <span className="flex-1">{m.label}</span>
              <ChevronRight size={15} style={{ color: c.disabled }} />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => { setPicks((p) => [...p, o]); setStep((s) => s + 1); }}
              className="flex items-center justify-between rounded-xl p-3.5 text-left text-sm pui-lift hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150"
              style={{ background: c.card, border: `1px solid ${c.border}`, color: c.textPrimary }}
            >
              {o}
              <ChevronRight size={15} style={{ color: c.disabled }} />
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

/* ---------------- Review ---------------- */

const WEEK_ACTIVITY = [
  { d: "M", v: 30 }, { d: "T", v: 55 }, { d: "W", v: 40 }, { d: "T", v: 75 },
  { d: "F", v: 20 }, { d: "S", v: 60 }, { d: "S", v: 45 },
];

const RECENT_SESSIONS = [
  { id: 1, deck: "Pharmacology", when: "Today, 8:40 AM", score: "94%" },
  { id: 2, deck: "Cardiology", when: "Yesterday, 6:15 PM", score: "87%" },
  { id: 3, deck: "Anatomy", when: "2 days ago", score: "91%" },
];

function ReviewPage({ onOpenSession = () => {} }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const loading = useBriefLoading();
  return (
    <PageLayout
      hero={
        <div className="rounded-2xl p-5 text-center" style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: theme.shadows.low }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: c.muted }}>
            Today's Review
          </div>
          <div className="text-4xl font-bold mt-2.5 leading-none tracking-tight" style={{ color: c.textPrimary }}>47</div>
          <div className="text-xs mt-1.5" style={{ color: c.textSecondary }}>cards ready for review</div>
          <div className="mt-5">
            <Button variant="primary" fullWidth icon={Play}>Start Review</Button>
          </div>
        </div>
      }
    >
      <SectionHeading>This Week</SectionHeading>
      <div className="rounded-2xl p-4" style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: theme.shadows.low }}>
        <div className="flex items-end justify-between h-20 gap-2.5">
          {WEEK_ACTIVITY.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full rounded-lg flex items-end overflow-hidden" style={{ height: 56, background: c.surface }}>
                <div
                  className="w-full rounded-lg transition-[height] duration-300 ease-out"
                  style={{ height: `${day.v}%`, background: c.primary }}
                />
              </div>
              <span className="text-[10px] font-medium" style={{ color: c.muted }}>{day.d}</span>
            </div>
          ))}
        </div>
      </div>

      <SectionHeading>Recent Sessions</SectionHeading>
      {loading ? (
        <div className="flex gap-2.5">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} style={{ width: 280 }}><ItemCardSkeleton /></div>
          ))}
        </div>
      ) : (
      <RecentRow scrollKey="review-recent-sessions">
        {RECENT_SESSIONS.map((s) => (
          <div key={s.id} style={{ width: 280, scrollSnapAlign: "start" }}>
            <ItemCard
              onClick={() => onOpenSession(s.deck)}
              icon={Clock}
              iconSize={16}
              iconBoxClass="w-9 h-9 rounded-lg"
              title={s.deck}
              titleClass="text-sm font-medium truncate"
              subtitle={s.when}
              subtitleClass="text-xs mt-0.5"
              trailing={
                <span className="text-xs font-semibold rounded-full px-2.5 py-1" style={{ color: c.textSecondary, background: c.surface }}>{s.score}</span>
              }
            />
          </div>
        ))}
      </RecentRow>
      )}
    </PageLayout>
  );
}

/* ---------------- Progress ---------------- */

const SUBJECT_PROGRESS = [
  { id: 1, name: "Pharmacology", value: 68 },
  { id: 2, name: "Anatomy & Physiology", value: 42 },
  { id: 3, name: "Biochemistry", value: 91 },
  { id: 4, name: "Microbiology", value: 12 },
];

function ProgressPage({ onOpenSubject = () => {} }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <PageLayout
      hero={
        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={TrendingUp} label="Overall Progress" value="63%" />
          <StatTile icon={Flame} label="Study Streak" value="6 days" />
          <StatTile icon={Award} label="Total XP" value="1,240" />
          <StatTile icon={Check} label="Cards Mastered" value="482" />
        </div>
      }
    >
      <SectionHeading>By Subject</SectionHeading>
      <div className="flex flex-col rounded-2xl p-4" style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: theme.shadows.low }}>
        {SUBJECT_PROGRESS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onOpenSubject(s.name)}
            className="text-left -mx-1 px-1 rounded-lg pui-lift transition-colors duration-150 pb-4"
            style={i > 0 ? { paddingTop: theme.spacing.md, borderTop: `1px solid ${c.border}` } : undefined}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: c.textPrimary }}>{s.name}</span>
              <span className="text-xs font-medium" style={{ color: c.textSecondary }}>{s.value}%</span>
            </div>
            <ProgressBar value={s.value} />
          </button>
        ))}
      </div>
    </PageLayout>
  );
}

/* ---------------- Saved Library ---------------- */

// Content types the app can actually save today, and the tile each shows
// up under. Everything else in SAVED_GROUPS_PLACEHOLDER has no real entity
// type behind it yet, so those tiles stay as the navigation-shell
// placeholders they always were.
const SAVED_ENTITY_TYPE_META = {
  course: { label: "Saved Courses", icon: GraduationCap },
  note: { label: "Saved Notes", icon: FileText },
  deck: { label: "Saved Flashcards", icon: Bookmark },
  quizSet: { label: "Saved Quiz Sets", icon: ListChecks },
};

const SAVED_GROUPS_PLACEHOLDER = [
  { label: "Saved Subjects", icon: BookOpen },
  { label: "Saved Topics", icon: Layers },
  { label: "Saved Lessons", icon: Play },
  { label: "Saved Reviews", icon: Clock },
  { label: "Saved Resources", icon: Globe },
  { label: "Saved Attachments", icon: Paperclip },
  { label: "Saved Searches", icon: Search },
  { label: "Saved Collections", icon: Folder },
];

// "Show me every saved entity" — the Saved page groups whatever comes
// back by type instead of iterating a hardcoded category list. A
// brand-new content type that starts using useEntityFlags(type, id) shows
// up here the moment something in it gets saved, with no change to this
// page. Types without a real save flow yet keep the same look they always
// had (a tile with no count) via SAVED_GROUPS_PLACEHOLDER.
function SavedPage({ onOpenGroup = () => {} }) {
  const { getAllWithFlag } = useEntityMetadata();
  const saved = getAllWithFlag("saved");
  const countByType = saved.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  const wiredGroups = Object.entries(SAVED_ENTITY_TYPE_META).map(([type, meta]) => ({
    label: meta.label,
    icon: meta.icon,
    meta: countByType[type] ? `${countByType[type]} saved` : undefined,
  }));

  return (
    <PageLayout
      header={{ title: "Saved", subtitle: "Everything you've saved, grouped in one place" }}
      categories={
        <>
          <SectionHeading>Library</SectionHeading>
          <div className="grid grid-cols-2 gap-2.5">
            {[...wiredGroups, ...SAVED_GROUPS_PLACEHOLDER].map((g) => (
              <CategoryCard key={g.label} icon={g.icon} label={g.label} meta={g.meta} onClick={() => onOpenGroup(g.label)} />
            ))}
          </div>
        </>
      }
    />
  );
}

/* ---------------- Quiz (constants + Study page composition) ---------------- */

const QUIZ_FILTERS = [
  "Course", "Subject", "Topic", "Lesson", "Difficulty", "Timed", "Untimed",
  "Random", "Incorrect Only", "Weak Areas", "Favorites", "Saved Presets",
];

const SAMPLE_QUIZ_SETS = [
  { id: 1, name: "Pharmacology Midterm", meta: "40 questions · Timed" },
  { id: 2, name: "Cardiology Basics", meta: "20 questions · Untimed" },
];

// Study is the home for every active-recall feature — Flashcards and
// Quizzes moved here in full (nothing removed, only relocated), plus Ice
// Breakers and the Recent/Saved/Pinned study-set sections that used to have
// no home at all. Flashcards and Quizzes each keep their own Toolbar
// instance (independent search/sort/filter/view/selection state per
// section) but it's the same shared Toolbar component and the same
// ItemCard/GridItemCard/ContextMenuSheet used everywhere else in the app —
// nothing here is a one-off. See STUDY_MODE_REGISTRY for how future modes
// (Practice Test, Timed Challenge, ...) slot in without touching this page.
// Which entity type(s) back each "Saved Study Sets" tile — Ice Breakers
// have no real entity type yet, so that tile just has no count.
const SAVED_STUDY_GROUP_TYPES = {
  "Saved Decks": ["deck"],
  "Saved Quizzes": ["quizSet"],
};

// Shared shape for ContextMenuSheet's `entity` prop, built once per content
// type instead of inline at each of the deck/quiz x grid/list call sites
// below — keeps the five fields (type/id/label/icon/meta) consistent if
// ContextMenuSheet's expected shape ever changes.
const deckMenuEntity = (d) => ({ type: "deck", id: d.id, label: d.name, icon: Bookmark, meta: `${d.total} cards total` });
const quizMenuEntity = (q) => ({ type: "quizSet", id: q.id, label: q.name, icon: ListChecks, meta: q.meta });

// Flashcards and Quiz each render the same shape — a grid/list toggle over
// a set of items, switching between GridItemCard and ItemCard — with only
// the per-item props differing. toGridProps/toItemProps build those props
// per item so this stays a plain render loop rather than a config object,
// which keeps each section's actual card props (e.g. deck's progress/
// badgeText, quiz's chevron) visible at the call site instead of hidden
// behind a shared schema.
function renderStudyList(items, view, toGridProps, toItemProps) {
  return items.map((item) =>
    view === "grid" ? (
      <GridItemCard key={item.id} {...toGridProps(item)} />
    ) : (
      <ItemCard key={item.id} {...toItemProps(item)} />
    )
  );
}

function StudyPage({ onOpenItem = () => {}, activeMode = null, setActiveMode = () => {} }) {
  const { theme } = useTheme();
  const totalDue = SAMPLE_DECKS.reduce((sum, d) => sum + d.due, 0);
  const [deckCategory, setDeckCategory] = useState("Manual Decks");
  const [quizFilter, setQuizFilter] = useState(null);
  const [studyOpen, setStudyOpen] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [deckView, setDeckView] = useState("list");
  const [quizView, setQuizView] = useState("list");
  const { getAllWithFlag } = useEntityMetadata();
  const savedStudySetCounts = Object.fromEntries(
    Object.entries(SAVED_STUDY_GROUP_TYPES).map(([label, types]) => [label, getAllWithFlag("saved", types).length])
  );

  // activeMode: null = the Study Modes hub; otherwise the id of whichever
  // hub card was opened (e.g. "flashcards", "quiz"). Owned by AppShell (see
  // the App-level `studyMode` state) so the shared Header back-button and
  // title handle it exactly like every other page's back navigation —
  // everything below still reads from the same state/data as before, just
  // shown conditionally instead of always stacked.
  const hubStatsCtx = {
    deckCount: SAMPLE_DECKS.length,
    totalDue,
    quizSetCount: SAMPLE_QUIZ_SETS.length,
  };

  return (
    <PageLayout
      header={{
        title: "Study",
        subtitle: "Every way to actively recall what you've learned",
      }}
      hero={
        <>
          <div
            className="rounded-2xl p-4 flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${darken(theme.colors.primary, 0.28)}, ${darken(theme.colors.primary, 0.42)})`,
              boxShadow: theme.shadows.high,
            }}
          >
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: withAlpha(theme.colors.onAccent, 0.65) }}>Due Today</div>
              <div className="text-2xl font-semibold mt-1.5 leading-none tracking-tight" style={{ color: theme.colors.onAccent }}>{totalDue} cards</div>
            </div>
            <button
              onClick={() => setStudyOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-full pl-3.5 pr-3 py-2.5 pui-press"
              style={{ background: theme.colors.onAccent, color: darken(theme.colors.primary, 0.28), "--pui-depth": "3px", "--pui-depth-color": withAlpha(theme.colors.onAccent, 0.4), marginBottom: 3 }}
            >
              Study
              <Play size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <StatTile icon={Clock} label="Study Queue" value="47" />
            <StatTile icon={Timer} label="Upcoming Reviews" value="12 today" />
          </div>
        </>
      }
    >
      {activeMode === null ? (
        <>
          {/* ---- Recent Study ---- */}
          <SectionHeading>Recent Study</SectionHeading>
          <RecentRow scrollKey="study-recent-study">
            {RECENT_SESSIONS.map((s) => (
              <div key={s.id} style={{ width: 280, scrollSnapAlign: "start" }}>
                <ItemCard
                  onClick={() => onOpenItem(s.deck)}
                  icon={Clock}
                  iconSize={16}
                  iconBoxClass="w-9 h-9 rounded-lg"
                  title={s.deck}
                  titleClass="text-sm font-medium truncate"
                  subtitle={s.when}
                  subtitleClass="text-xs mt-0.5"
                  trailing={
                    <span className="text-xs font-semibold rounded-full px-2.5 py-1" style={{ color: theme.colors.textSecondary, background: theme.colors.surface }}>{s.score}</span>
                  }
                />
              </div>
            ))}
          </RecentRow>

          {/* ---- Study Modes hub ----
              Renders whatever is in STUDY_HUB_MODES. Adding a new mode
              later is a registry entry, not a layout change — this grid
              never hardcodes Flashcards/Quiz. */}
          <SectionHeading>Study Modes</SectionHeading>
          <div className="grid grid-cols-1 gap-3">
            {STUDY_HUB_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                className="w-full flex items-center gap-3.5 rounded-2xl p-4 text-left pui-lift hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150"
                style={{ background: theme.colors.card, border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows.low }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl" style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                  {m.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold" style={{ color: theme.colors.textPrimary }}>{m.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>{m.description}</div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {m.getStats(hubStatsCtx).map((stat, i) => (
                      <span key={i} className="text-[11px] font-medium rounded-full px-2.5 py-1" style={{ color: theme.colors.textSecondary, background: theme.colors.surface }}>
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className="flex items-center gap-0.5 text-xs font-semibold shrink-0"
                  style={{ color: theme.colors.primary }}
                >
                  {m.actionLabel}
                  <ChevronRight size={14} />
                </span>
              </button>
            ))}
          </div>

          {/* ---- Ice Breakers ---- */}
          <SectionHeading>Ice Breakers</SectionHeading>
          <EmptyState
            icon={Flame}
            title="Warm up before you dive in"
            subtitle="Quick, low-stakes prompts to get your recall going. Not wired up yet."
            primaryAction={{ label: "Start Ice Breaker", onClick: () => setStudyOpen(true) }}
          />

          {/* ---- Saved / Pinned Study Sets ---- */}
          <SectionHeading>Saved Study Sets</SectionHeading>
          <div className="grid grid-cols-2 gap-2.5">
            {SAVED_STUDY_GROUPS.map((g) => {
              const count = savedStudySetCounts[g.label];
              return (
                <CategoryCard
                  key={g.label}
                  icon={g.icon}
                  label={g.label}
                  meta={count ? `${count} saved` : undefined}
                  onClick={() => onOpenItem(g.label)}
                />
              );
            })}
          </div>

          <SectionHeading>Pinned Study Sets</SectionHeading>
          <EntityFlagSection
            flag="pinned"
            types={["deck", "quizSet"]}
            icon={Pin}
            title="Nothing pinned yet"
            subtitle="Pin a deck, quiz, or lesson from its menu to keep it here for quick access."
            onOpenEntity={onOpenItem}
          />

          {/* ---- More Ways to Study (future modes — architecture only, not implemented) ---- */}
          <SectionHeading>More Ways to Study</SectionHeading>
          <div className="grid grid-cols-2 gap-2.5">
            {STUDY_MODE_REGISTRY.filter((m) => !m.active).map((m) => (
              <div
                key={m.id}
                className="flex flex-col items-start gap-2.5 rounded-2xl p-3.5 text-left opacity-70"
                style={{ background: withAlpha(theme.colors.surface, 0.7), border: `1px dashed ${theme.colors.border}` }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: theme.colors.card, border: `1px solid ${theme.colors.border}` }}>
                  <m.icon size={16} style={{ color: theme.colors.muted }} />
                </div>
                <div className="min-w-0 w-full">
                  <div className="text-sm font-medium truncate" style={{ color: theme.colors.textSecondary }}>{m.label}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: theme.colors.muted }}>Coming soon</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {activeMode === "flashcards" && (
            <>
              {/* ---- Flashcards ---- */}
              <SectionHeading
                trailing={
                  <button
                    onClick={() => setStudyOpen(true)}
                    className="text-[11px] font-medium pui-lift"
                    style={{ color: theme.colors.muted }}
                  >
                    Study now
                  </button>
                }
              >
                Flashcards
              </SectionHeading>
              <ChipRow items={DECK_CATEGORIES} active={deckCategory} onSelect={setDeckCategory} />
              <Toolbar view={deckView} onToggleView={() => setDeckView((v) => (v === "list" ? "grid" : "list"))} />
              <div className={`mt-3 ${deckView === "grid" ? "grid grid-cols-2 gap-2.5 items-stretch" : "flex flex-col gap-2.5"}`}>
                {renderStudyList(
                  SAMPLE_DECKS,
                  deckView,
                  (d) => ({
                    onClick: () => onOpenItem(d.name),
                    icon: Bookmark,
                    title: d.name,
                    subtitle: `${d.total} cards total`,
                    progress: Math.round(((d.total - d.due) / d.total) * 100),
                    badgeText: `${d.due} due`,
                    onMenuOpen: () => setMenuFor(deckMenuEntity(d)),
                  }),
                  (d) => ({
                    onClick: () => onOpenItem(d.name),
                    icon: Bookmark,
                    title: d.name,
                    subtitle: `${d.total} cards total`,
                    trailing: (
                      <span
                        className="text-xs font-semibold rounded-full px-2.5 py-1 shrink-0"
                        style={{ color: theme.colors.primary, background: `${theme.colors.primary}14` }}
                      >
                        {d.due} due
                      </span>
                    ),
                    onMenuOpen: () => setMenuFor(deckMenuEntity(d)),
                  })
                )}
              </div>

              <EmptyState
                icon={FolderPlus}
                title="Looking for another deck?"
                subtitle="Bring in more cards to study, or jump into a deck you already have."
                actions={[
                  { label: "Create Deck", onClick: () => {} },
                  { label: "Import Deck", onClick: () => {} },
                  { label: "Study Existing Deck", onClick: () => setStudyOpen(true) },
                ]}
              />
            </>
          )}

          {activeMode === "quiz" && (
            <>
              {/* ---- Quizzes ---- */}
              <div className="grid grid-cols-2 gap-2.5">
                {QUIZ_SHORTCUTS.map((q) => (
                  <CategoryCard key={q.label} icon={q.icon} label={q.label} onClick={() => {}} />
                ))}
              </div>
              <ChipRow items={QUIZ_FILTERS} active={quizFilter} onSelect={setQuizFilter} />
              <Toolbar view={quizView} onToggleView={() => setQuizView((v) => (v === "list" ? "grid" : "list"))} />
              <div className={`mt-3 ${quizView === "grid" ? "grid grid-cols-2 gap-2.5 items-stretch" : "flex flex-col gap-2.5"}`}>
                {renderStudyList(
                  SAMPLE_QUIZ_SETS,
                  quizView,
                  (q) => ({
                    onClick: () => onOpenItem(q.name),
                    icon: ListChecks,
                    title: q.name,
                    subtitle: q.meta,
                    onMenuOpen: () => setMenuFor(quizMenuEntity(q)),
                  }),
                  (q) => ({
                    onClick: () => onOpenItem(q.name),
                    icon: ListChecks,
                    title: q.name,
                    subtitle: q.meta,
                    chevron: true,
                    onMenuOpen: () => setMenuFor(quizMenuEntity(q)),
                  })
                )}
              </div>

              <EmptyState
                icon={ListChecks}
                title="Create a custom quiz"
                subtitle="Pick a source and filters above, then generate a quiz from it. Not wired up yet."
                primaryAction={{ label: "New Quiz", onClick: () => {} }}
                secondaryAction={{ label: "Saved Presets", onClick: () => {} }}
              />
            </>
          )}
        </>
      )}

      <StudyFlowSheet open={studyOpen} onClose={() => setStudyOpen(false)} />
      <ContextMenuSheet itemLabel={menuFor?.label} entity={menuFor} onClose={() => setMenuFor(null)} />
    </PageLayout>
  );
}

/* ---------------- Appearance (Settings > Appearance) ----------------
   Prompt 9A — reorganized into five focused cards: Theme Management
   (Import/Export), Display (Theme mode + Wallpaper + Wallpaper Tint,
   merged since both shape the app's overall look), Accent Palette (now
   the single source of every interface color — Interface Accent was
   redundant and has been removed), Card Color, and Icon Packs. There is
   no separate preview card — the app itself, reading the same useTheme()
   values as every other page, is the live preview, so every change here
   is visible immediately app-wide. Font Size, Density, Interface Style,
   Reduced Motion, Larger Text, and High Contrast still exist in the theme
   engine (nothing downstream breaks), they just don't have controls on
   this page yet — a dedicated Accessibility page can expose them later. */

// Prompt 9B #1 — a much quieter label than the old uppercase+icon section
// header: no icon, no letter-spacing, no all-caps shouting. Just enough
// weight to separate one card's purpose from the next while scanning the
// page as a gallery rather than a settings list.
function AppearanceSectionLabel({ children }) {
  const { theme } = useTheme();
  return (
    <Text variant="caption" weight={600} color={theme.colors.muted}>
      {children}
    </Text>
  );
}

// A card wrapper that groups related Appearance controls. Prompt 10.4
// reverses the earlier "compact workspace" density pass — this page should
// read as calm and generously spaced (Material 3 / Apple Settings style),
// not optimized to fit as much as possible on screen. Vertical padding is
// noticeably larger than the horizontal padding so every card has real
// room to breathe top and bottom, not just side to side.
// Prompt 9B #1 — `title` is still optional. Cards whose contents already
// explain themselves (Theme Management's Import/Export buttons) pass no
// title at all and skip the header row entirely, rather than every card
// being forced to carry one.
function AppearanceGroup({ title, trailing, children }) {
  const { theme } = useTheme();
  return (
    <Card variant="default" style={{ padding: `${theme.spacing.xl}px ${theme.spacing.lg}px` }}>
      {title && (
        <div className="flex items-center justify-between" style={{ marginBottom: theme.spacing.lg }}>
          <AppearanceSectionLabel>{title}</AppearanceSectionLabel>
          {trailing}
        </div>
      )}
      {/* Prompt 10.4 — rows of controls within a card now get real
          separation (lg) instead of being packed tight, so each control
          reads as its own row rather than a dense list. */}
      <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.lg }}>{children}</div>
    </Card>
  );
}

// A circular color swatch with a small pencil badge so every editable
// color in the studio (Accent Palette's three tones, Card Color, Interface
// Accent) visibly invites a tap instead of looking like inert decoration —
// Prompt 8A #3.
function EditableSwatch({ label, hex, onClick, size = 40, dense = false }) {
  const { theme } = useTheme();
  return (
    <button onClick={onClick} className="flex flex-col items-center pui-lift active:scale-95" style={{ gap: dense ? 2 : 4 }} aria-label={`Edit ${label}`}>
      <span className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <span style={{ width: size, height: size, borderRadius: "50%", background: hex, border: `1px solid ${theme.colors.border}`, display: "block", boxShadow: theme.shadows.low }} />
        <span
          className="absolute flex items-center justify-center"
          style={{
            width: 16, height: 16, borderRadius: "50%", right: -2, bottom: -2,
            background: theme.colors.card, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSecondary,
            boxShadow: theme.shadows.low,
          }}
        >
          <Edit3 size={9} />
        </span>
      </span>
      {/* Prompt 10A #4 — dense labels sit lighter and smaller than the
          default caption so the color circle stays the visual focus. */}
      <Text variant="caption" color={theme.colors.muted} style={dense ? { fontSize: 10, fontWeight: 500, opacity: 0.7 } : undefined}>{label}</Text>
    </button>
  );
}

// Prompt 8A #4 — Wallpaper picker. Presets are CSS gradients (see
// WALLPAPER_PRESETS) so selection previews instantly with no image load;
// the disabled "Import" tile is architecture only, for a future imported
// wallpaper.
function WallpaperPickerSheet({ open, onClose, value, onChange }) {
  const { theme } = useTheme();
  if (!open) return null;
  return (
    <ThemedSheet open={open} onClose={onClose} title="Wallpaper">
      <div className="grid grid-cols-3" style={{ gap: theme.spacing.sm }}>
        {WALLPAPER_PRESETS.map((w) => {
          const isActive = value === w.id;
          return (
            <button key={w.id} onClick={() => onChange(w.id)} className="flex flex-col items-center pui-lift active:scale-[0.97]" style={{ gap: 6 }}>
              {/* Prompt 10A #6 — selection reads through a colored border
                  plus a soft outer glow, not a checkmark covering the
                  preview; a small corner badge (matching Icon Packs) is
                  enough to confirm the choice without hiding it. */}
              <span
                className="relative w-full flex items-center justify-center"
                style={{
                  aspectRatio: "1", borderRadius: theme.radius.lg,
                  background: w.css || theme.colors.background,
                  border: isActive ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                  boxShadow: isActive ? `0 0 0 3px ${withAlpha(theme.colors.primary, 0.15)}` : "none",
                  transition: theme.reducedMotion ? "none" : "border-color var(--motion-base) ease, box-shadow var(--motion-base) ease",
                }}
              >
                {isActive && (
                  <span
                    className="absolute flex items-center justify-center"
                    style={{ top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: theme.colors.primary, color: theme.colors.onAccent, boxShadow: theme.shadows.low }}
                  >
                    <Check size={10} />
                  </span>
                )}
              </span>
              <Text variant="caption" weight={600} color={theme.colors.textSecondary}>{w.label}</Text>
            </button>
          );
        })}
        <button disabled className="flex flex-col items-center" style={{ gap: 6, opacity: 0.6 }}>
          <span className="w-full flex items-center justify-center" style={{ aspectRatio: "1", borderRadius: theme.radius.lg, background: "transparent", border: `1px dashed ${theme.colors.border}` }}>
            <UploadCloud size={16} style={{ color: theme.colors.muted }} />
          </span>
          <Text variant="caption" weight={600} color={theme.colors.muted}>Import</Text>
        </button>
      </div>
      <div style={{ marginTop: theme.spacing.lg }}>
        <Button variant="primary" fullWidth onClick={onClose}>Done</Button>
      </div>
    </ThemedSheet>
  );
}

// Prompt 10A #3 — one row inside the Background Color confirmation popup.
// A filled radio dot (with a small check, never a large overlay) plus a
// border/tint highlight on the row itself is the same "elegant, not
// distracting" selection language as every other control on this page.
function BackgroundColorOptionRow({ label, previewColor, dashed, selected, onClick }) {
  const { theme } = useTheme();
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center pui-lift active:scale-[0.99]"
      style={{
        gap: theme.spacing.md,
        padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
        borderRadius: theme.radius.md,
        background: selected ? withAlpha(theme.colors.primary, 0.08) : "transparent",
        border: selected ? `1.5px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
      }}
    >
      <span
        className="shrink-0"
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: previewColor || theme.colors.background,
          border: dashed ? `1px dashed ${theme.colors.border}` : `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows.low,
        }}
      />
      <Text as="div" variant="body" weight={600} className="flex-1 text-left" color={theme.colors.textPrimary}>{label}</Text>
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 20, height: 20, borderRadius: "50%",
          border: `1.5px solid ${selected ? theme.colors.primary : theme.colors.border}`,
          background: selected ? theme.colors.primary : "transparent",
          transition: theme.reducedMotion ? "none" : "background-color var(--motion-fast) ease, border-color var(--motion-fast) ease",
        }}
      >
        {selected && <Check size={11} color="#fff" />}
      </span>
    </button>
  );
}

// Prompt 10A #3 — the "Apply Background Color" popup. Tapping the
// Background swatch on the Display card opens this; tapping a row only
// stages a choice, Cancel discards it, and Apply is the single moment the
// live background actually changes (still no separate Save/Apply page —
// this compact popup IS the confirmation, per Prompt 10A #5).
function BackgroundColorSheet({ open, onClose, choice, onChoose, customHex, onEditCustom, onApply }) {
  const { theme } = useTheme();
  return (
    <BottomSheet open={open} onClose={onClose} title="Apply Background Color">
      <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.sm }}>
        <BackgroundColorOptionRow label="Default" previewColor={theme.colors.background} selected={choice === "default"} onClick={() => onChoose("default")} />
        <BackgroundColorOptionRow label="Light" previewColor="#FFFFFF" selected={choice === "light"} onClick={() => onChoose("light")} />
        <BackgroundColorOptionRow label="Custom" previewColor={customHex} dashed={choice !== "custom"} selected={choice === "custom"} onClick={onEditCustom} />
      </div>
      <div className="flex items-center gap-2" style={{ marginTop: theme.spacing.lg }}>
        <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
        <Button variant="primary" fullWidth onClick={onApply}>Apply</Button>
      </div>
    </BottomSheet>
  );
}

function AppearancePage() {
  const {
    theme, appearance, resolvedMode,
    setMode, setAccent, setCustomAccentHex, setAccentOverride,
    setCardColorHex, resetCardColor,
    setWallpaper, setWallpaperTint, resetWallpaperTint,
    setIconPack, importIconPack,
    resetAppearance,
    importAppearance,
  } = useTheme();
  const { show } = useToast();
  const [picker, setPicker] = useState(null); // { title, value, onChange } | null
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const importInputRef = useRef(null);
  const iconImportInputRef = useRef(null);
  // Prompt 10C #1 — "Reset to defaults" moved out of the shared App Bar
  // (which should only handle navigation) and into this page's own content
  // header. resetAppearance/show are already available via
  // useTheme()/useToast(), so the trigger state and its confirmation
  // dialog live here alongside the page they affect.
  const [confirmingReset, setConfirmingReset] = useState(false);

  const MODE_OPTIONS = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];
  // Prompt 10A #2/#3 — Wallpaper Tint's own always-visible row (None/Dark/
  // Light/Custom) is gone. The same underlying field (wallpaperTintHex)
  // is now set through a single "Background Color" confirmation popup
  // instead, with the redundant pure-black "Dark" preset dropped — the
  // app's existing near-black background already covers that look, so it
  // becomes "Default" rather than a separate swatch.
  const ICON_PACK_SLOTS = [
    { id: "default", label: "Default Pack", locked: true, empty: false },
    { id: "custom1", label: appearance.customIconPacks.custom1?.label || "Custom Pack 1", locked: false, empty: !appearance.customIconPacks.custom1 },
    { id: "custom2", label: appearance.customIconPacks.custom2?.label || "Custom Pack 2", locked: false, empty: !appearance.customIconPacks.custom2 },
  ];

  const openPicker = (title, value, onChange) => setPicker({ title, value, onChange });

  // Prompt 10A #3 — the popup is a draft: tapping a row only stages a
  // choice (bgDraftChoice / bgDraftCustomHex), nothing in the live app
  // changes until Apply. Cancel just closes without touching appearance.
  const [backgroundSheetOpen, setBackgroundSheetOpen] = useState(false);
  const [bgDraftChoice, setBgDraftChoice] = useState("default");
  const [bgDraftCustomHex, setBgDraftCustomHex] = useState(appearance.wallpaperTintHex || "#3B7DFF");

  const openBackgroundColorSheet = () => {
    const hex = appearance.wallpaperTintHex;
    if (!hex) setBgDraftChoice("default");
    else if (hex.toUpperCase() === "#FFFFFF") setBgDraftChoice("light");
    else { setBgDraftChoice("custom"); setBgDraftCustomHex(hex); }
    setBackgroundSheetOpen(true);
  };
  const applyBackgroundColor = () => {
    if (bgDraftChoice === "default") resetWallpaperTint();
    else if (bgDraftChoice === "light") setWallpaperTint("#FFFFFF");
    else setWallpaperTint(bgDraftCustomHex);
    setBackgroundSheetOpen(false);
    show("Background updated");
  };
  // Tapping the Custom row both selects it and opens the nested hex
  // picker so its preview swatch reflects the exact color before Apply.
  const editBackgroundCustomColor = () => {
    setBgDraftChoice("custom");
    openPicker("Custom Background Color", bgDraftCustomHex, setBgDraftCustomHex);
  };

  // Prompt 8A #1 — Export produces a small portable JSON file of exactly
  // the fields this page controls; Import reads one back in (via a hidden
  // file input — there's no real dialog affordance otherwise) and merges
  // only recognized keys through importAppearance, so a bad file can't
  // corrupt the rest of the app's state.
  const handleExport = () => {
    const payload = {
      mode: appearance.mode, accent: appearance.accent, customAccentHex: appearance.customAccentHex,
      accentOverrides: appearance.accentOverrides,
      cardColorHex: appearance.cardColorHex, wallpaper: appearance.wallpaper, wallpaperTintHex: appearance.wallpaperTintHex,
      iconPack: appearance.iconPack, customIconPacks: appearance.customIconPacks,
    };
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plug-theme.json";
      a.click();
      URL.revokeObjectURL(url);
      show("Theme exported");
    } catch {
      show("Couldn't export theme");
    }
  };
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const ok = importAppearance(JSON.parse(String(reader.result)));
        show(ok ? "Theme imported" : "That file didn't look like a Plug theme");
      } catch {
        show("Couldn't read that file");
      }
    };
    reader.readAsText(file);
  };
  // Icon packs are architecture-only (see DEFAULT_APPEARANCE) — importing
  // doesn't parse real icon data, it just claims the first open Custom slot
  // under the file's name, ready for real artwork later.
  const handleIconImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    importIconPack(file.name.replace(/\.[^.]+$/, ""));
    show("Icon pack imported");
  };

  return (
    <div className="mx-auto w-full px-4 pt-4 pb-10" style={{ maxWidth: 420, display: "flex", flexDirection: "column", gap: theme.spacing.xl }}>
      {/* ---- Page content header (Prompt 10.3) — the App Bar above is the
          only place the page title ("Themes") now appears, so this row no
          longer repeats it and holds just its one page-level action. The
          page's own top/side padding (added in Prompt 10.4) keeps this row
          off the top and right edges instead of sitting flush against
          them; the container's gap below handles the space before the
          first card, so no extra margin is needed here. ---- */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setConfirmingReset(true)}
          className="flex items-center pui-lift active:scale-[0.97]"
          style={{ gap: 4, fontSize: `${theme.typography.caption.size}px`, color: theme.colors.muted, fontWeight: 600 }}
        >
          <RotateCcw size={11} />
          Reset to defaults
        </button>
      </div>

      {/* ---- Theme Management (Prompt 9A #1 / 9B #2) — no header: the two
          buttons are self-explanatory, and this stays the first card. ---- */}
      <AppearanceGroup>
        <div className="flex" style={{ gap: theme.spacing.sm }}>
          <Button variant="secondary" icon={UploadCloud} fullWidth onClick={() => importInputRef.current?.click()}>Import Theme</Button>
          <Button variant="secondary" icon={DownloadCloud} fullWidth onClick={handleExport}>Export Theme</Button>
          <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />
        </div>
      </AppearanceGroup>

      {/* ---- Display: Theme + Background, one unified feature (Prompt 9B
          #3, refined by Prompt 10A #1). The wallpaper preview and the
          background-color picker now sit side by side — one feature, one
          row — instead of wallpaper and its tint reading as two separate
          settings. The old always-visible Wallpaper Tint swatches are
          gone; background color is now set through a confirmation popup
          (see BackgroundColorSheet), opened from the small swatch here. ---- */}
      <AppearanceGroup title="Display">
        <SnapSelector options={MODE_OPTIONS} value={appearance.mode} onChange={setMode} />

        {/* Prompt 10B #1 — Background regrouped into two simpler rows
            instead of one crowded row: preview + color dropper + Change
            Wallpaper button lead (vertically centered, button carries the
            emphasis now that the preview has shrunk), with the current
            wallpaper name as a small secondary line underneath rather
            than its own dedicated column. */}
        <div className="flex items-center" style={{ gap: theme.spacing.sm }}>
          {/* Wallpaper preview — de-emphasized and smaller; it's a status
              swatch now, not the row's focal point. Tapping it still
              opens the wallpaper picker directly. */}
          <button
            onClick={() => setWallpaperOpen(true)}
            aria-label="Change wallpaper"
            className="pui-lift active:scale-[0.97] shrink-0"
            style={{
              width: 44, height: 44, borderRadius: theme.radius.md,
              background: theme.wallpaperCss || theme.colors.background,
              border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows.low,
              transition: theme.reducedMotion ? "none" : "background var(--motion-slow) ease",
            }}
          />
          {/* Background color picker — a circular swatch (matching every
              other color control's shape on this page), tapping it opens
              the confirmation popup rather than applying instantly. */}
          <button
            onClick={openBackgroundColorSheet}
            aria-label="Background color"
            className="pui-lift active:scale-90 flex items-center justify-center shrink-0"
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: appearance.wallpaperTintHex || theme.colors.background,
              border: appearance.wallpaperTintHex ? `2px solid ${theme.colors.primary}` : `1px dashed ${theme.colors.border}`,
              boxShadow: appearance.wallpaperTintHex ? `0 0 0 3px ${withAlpha(theme.colors.primary, 0.15)}` : "none",
              transition: theme.reducedMotion ? "none" : "background-color var(--motion-base) ease, border-color var(--motion-base) ease, box-shadow var(--motion-base) ease",
            }}
          >
            <Pipette size={12} color={appearance.wallpaperTintHex ? "#fff" : theme.colors.muted} />
          </button>

          {/* The action button now takes the remaining width and carries
              the row's emphasis. */}
          <Button variant="secondary" size="sm" onClick={() => setWallpaperOpen(true)} className="flex-1">
            Change Wallpaper
          </Button>
        </div>

        <Text variant="caption" color={theme.colors.muted} as="div">
          Current: <span style={{ color: theme.colors.textPrimary, fontWeight: 600 }}>{WALLPAPER_PRESETS.find((w) => w.id === appearance.wallpaper)?.label || "None"}</span>
        </Text>
      </AppearanceGroup>

      {/* ---- Accent Palette (Prompt 10.3 redesign) — Primary/Secondary/
          Tertiary lead the left column, then all 8 swatches (7 presets +
          Custom, same size) sit together in one clean CSS grid instead of
          a wrapping row. Random is gone entirely — palette selection is
          just pick-a-swatch now. ---- */}
      <AppearanceGroup title="Accent Palette">
        <div className="flex items-stretch" style={{ gap: theme.spacing.lg }}>
          {/* Left column — the three editable tones, then the full 8-swatch
              preset grid underneath. */}
          <div className="flex-[3] min-w-0 flex flex-col justify-center" style={{ gap: theme.spacing.lg }}>
            <div className="flex items-center justify-between">
              <EditableSwatch
                label="Primary"
                hex={theme.accentPalette.primary}
                onClick={() => openPicker("Primary Color", appearance.accent === "custom" ? appearance.customAccentHex : theme.accentPalette.primary, setCustomAccentHex)}
                size={44}
              />
              <EditableSwatch
                label="Secondary"
                hex={theme.accentPalette.secondary}
                onClick={() => openPicker("Secondary Color", theme.accentPalette.secondary, (hex) => setAccentOverride("secondary", hex))}
                size={44}
              />
              <EditableSwatch
                label="Tertiary"
                hex={theme.accentPalette.tertiary}
                onClick={() => openPicker("Tertiary Color", theme.accentPalette.tertiary, (hex) => setAccentOverride("tertiary", hex))}
                size={44}
              />
            </div>

            {/* All 8 swatches — 7 presets plus Custom as the 8th slot, same
                size, laid out in one even 4-column grid (2 rows) rather
                than a wrapping flex row. */}
            <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: theme.spacing.md, justifyItems: "center" }}>
              {ACCENT_OPTIONS.filter((o) => o.id !== "custom").map((opt) => {
                const isActive = appearance.accent === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setAccent(opt.id)}
                    aria-label={opt.label}
                    className="active:scale-90 flex items-center justify-center shrink-0"
                    style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: opt.hex,
                      border: isActive ? `2px solid ${theme.colors.textPrimary}` : `1px solid ${theme.colors.border}`,
                      boxShadow: isActive ? `0 0 0 3px ${withAlpha(opt.hex, 0.25)}` : theme.shadows.low,
                      transition: theme.reducedMotion ? "none" : "transform var(--motion-fast) ease, border-color var(--motion-base) ease, box-shadow var(--motion-base) ease",
                    }}
                  >
                    {isActive && <Check size={11} color="#fff" />}
                  </button>
                );
              })}
              <button
                onClick={() => openPicker("Custom Accent Color", appearance.accent === "custom" ? appearance.customAccentHex : theme.accentPalette.primary, setCustomAccentHex)}
                aria-label="Custom accent color"
                className="relative active:scale-90 flex items-center justify-center shrink-0"
                style={{ width: 34, height: 34 }}
              >
                <span
                  style={{
                    width: 34, height: 34, borderRadius: "50%", display: "block",
                    background: appearance.customAccentHex,
                    border: appearance.accent === "custom" ? `2px solid ${theme.colors.textPrimary}` : `1px solid ${theme.colors.border}`,
                    boxShadow: appearance.accent === "custom" ? `0 0 0 3px ${withAlpha(appearance.customAccentHex, 0.25)}` : theme.shadows.low,
                  }}
                />
                <span
                  className="absolute flex items-center justify-center"
                  style={{
                    width: 14, height: 14, borderRadius: "50%", right: -2, bottom: -2,
                    background: theme.colors.card, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSecondary,
                    boxShadow: theme.shadows.low,
                  }}
                >
                  <Edit3 size={8} />
                </span>
              </button>
            </div>
          </div>

          {/* Single vertical divider — the one seam in the whole layout,
              stretching the full height of the row via items-stretch on
              the parent so it never looks like a short, floating tick. */}
          <div aria-hidden="true" style={{ width: 1, background: theme.colors.border }} />

          {/* Right column — Card Color: a compact, vertically centered
              editor instead of a large blank area. Title leads (bold,
              full-contrast text instead of the usual muted caption, so it
              reads immediately next to the left column's own labels), then
              a large preview circle for the current color, four presets
              below it, and a small Reset link — matching the left
              column's density instead of leaving empty space beneath it. ---- */}
          <div className="flex-[2] min-w-0 flex flex-col items-center justify-center text-center" style={{ gap: theme.spacing.sm, padding: `0 ${theme.spacing.sm}px` }}>
            <Text variant="body" weight={700} color={theme.colors.textPrimary}>Card Color</Text>

            <button
              onClick={() => openPicker("Card Color", appearance.cardColorHex || theme.colors.card, setCardColorHex)}
              aria-label="Edit Card Color"
              className="relative active:scale-95 pui-lift flex items-center justify-center shrink-0"
              style={{ width: 64, height: 64 }}
            >
              <span style={{ width: 64, height: 64, borderRadius: "50%", display: "block", background: theme.colors.card, border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows.low }} />
              <span
                className="absolute flex items-center justify-center"
                style={{
                  width: 18, height: 18, borderRadius: "50%", right: -2, bottom: -2,
                  background: theme.colors.card, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSecondary,
                  boxShadow: theme.shadows.low,
                }}
              >
                <Edit3 size={10} />
              </span>
            </button>

            <div className="flex items-center justify-center" style={{ gap: theme.spacing.sm }}>
              {CARD_COLOR_PRESETS.map((preset) => {
                const isActive = (appearance.cardColorHex || "").toUpperCase() === preset.hex.toUpperCase();
                return (
                  <button
                    key={preset.id}
                    onClick={() => setCardColorHex(preset.hex)}
                    aria-label={preset.label}
                    className="active:scale-90 flex items-center justify-center shrink-0"
                    style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: preset.hex,
                      border: isActive ? `2px solid ${theme.colors.textPrimary}` : `1px solid ${theme.colors.border}`,
                      boxShadow: isActive ? `0 0 0 2px ${withAlpha(preset.hex, 0.25)}` : theme.shadows.low,
                    }}
                  />
                );
              })}
            </div>

            <button
              onClick={resetCardColor}
              disabled={!appearance.cardColorHex}
              className="pui-lift active:scale-95"
              style={{ fontSize: 11, fontWeight: 700, color: appearance.cardColorHex ? theme.colors.primary : theme.colors.disabled, opacity: appearance.cardColorHex ? 1 : 0.5 }}
            >
              Reset
            </button>
          </div>
        </div>
      </AppearanceGroup>

      {/* ---- Icon Packs (Prompt 9B #6) — three compact cards in a single
          row, like picking a theme rather than browsing a settings list.
          Each card reserves its icon-glyph square for a future thumbnail
          preview. One full-width Import button sits below, rather than
          competing for space beside the presets. ---- */}
      <AppearanceGroup title="Icon Packs">
        <div className="grid grid-cols-3" style={{ gap: theme.spacing.md }}>
          {ICON_PACK_SLOTS.map((pack) => {
            const isActive = appearance.iconPack === pack.id;
            const disabled = pack.empty;
            return (
              <button
                key={pack.id}
                onClick={() => !disabled && setIconPack(pack.id)}
                disabled={disabled}
                className={`flex flex-col items-center pui-lift ${disabled ? "" : "active:scale-[0.97]"}`}
                style={{
                  gap: theme.spacing.xs,
                  padding: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  background: isActive ? withAlpha(theme.colors.primary, 0.1) : theme.colors.background,
                  border: isActive ? `1.5px solid ${theme.colors.primary}` : disabled ? `1px dashed ${theme.colors.border}` : `1px solid ${theme.colors.border}`,
                  boxShadow: isActive ? `0 0 0 3px ${withAlpha(theme.colors.primary, 0.12)}` : "none",
                  opacity: disabled ? 0.65 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                  transition: theme.reducedMotion ? "none" : "border-color var(--motion-base) ease, box-shadow var(--motion-base) ease, background-color var(--motion-base) ease",
                }}
              >
                {/* Thumbnail slot — icon glyphs stand in until real pack
                    thumbnails exist; the square shape and sizing are ready
                    for that swap without any layout change. */}
                <span className="relative w-full flex items-center justify-center shrink-0" style={{ aspectRatio: "1", borderRadius: theme.radius.sm, background: theme.colors.card }}>
                  <div className="flex items-center" style={{ gap: 3, color: isActive ? theme.colors.primary : disabled ? theme.colors.muted : theme.colors.textSecondary }}>
                    <GraduationCap size={14} /><BookOpen size={14} /><Layers size={14} />
                  </div>
                  {isActive && (
                    <span className="absolute flex items-center justify-center" style={{ top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: theme.colors.primary, color: theme.colors.onAccent, boxShadow: theme.shadows.low }}>
                      <Check size={10} />
                    </span>
                  )}
                </span>
                <Text
                  as="div"
                  variant="caption"
                  weight={600}
                  color={disabled ? theme.colors.muted : theme.colors.textPrimary}
                  className="w-full text-center truncate"
                >
                  {pack.label}
                </Text>
              </button>
            );
          })}
        </div>

        {/* Prompt 10C #2 — more breathing room before the import action
            (lg instead of xs) so the three presets read as "choose one
            of these" first, with "or import a new one" as a clearly
            separate next step rather than a tightly attached button. */}
        <Button variant="secondary" icon={UploadCloud} fullWidth onClick={() => iconImportInputRef.current?.click()} style={{ marginTop: theme.spacing.lg }}>
          Import Icon Pack
        </Button>
        <input ref={iconImportInputRef} type="file" className="hidden" onChange={handleIconImportFile} />
      </AppearanceGroup>

      <WallpaperPickerSheet open={wallpaperOpen} onClose={() => setWallpaperOpen(false)} value={appearance.wallpaper} onChange={setWallpaper} />

      <BackgroundColorSheet
        open={backgroundSheetOpen}
        onClose={() => setBackgroundSheetOpen(false)}
        choice={bgDraftChoice}
        onChoose={setBgDraftChoice}
        customHex={bgDraftCustomHex}
        onEditCustom={editBackgroundCustomColor}
        onApply={applyBackgroundColor}
      />

      {/* Rendered after BackgroundColorSheet so it stacks visually on top
          of it — this is the same picker dialog Accent/Card Colors use,
          reused here for the "Custom" row's nested hex picker. */}
      <ColorPickerDialog
        open={!!picker}
        onClose={() => setPicker(null)}
        title={picker?.title || ""}
        value={picker?.value || "#3B7DFF"}
        onChange={(hex) => picker?.onChange?.(hex)}
      />

      <ConfirmSheet
        open={confirmingReset}
        onClose={() => setConfirmingReset(false)}
        onConfirm={() => { resetAppearance(); show("Appearance reset to defaults"); }}
        title="Reset appearance?"
        message="Theme, colors, wallpaper, and icon packs all return to their defaults. This can't be undone."
        confirmLabel="Reset"
      />
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsRow({ icon: Icon, label, value, last, onClick }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left pui-lift active:scale-[0.99]"
      style={last ? undefined : { borderBottom: `1px solid ${c.border}` }}
    >
      {/* Subtle gradient + inset highlight on the icon tile instead of a
          flat gray fill — same "molded surface" touch as the card
          primitives, at icon-tile scale. */}
      <span
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{
          background: `linear-gradient(180deg, ${lighten(c.surface, 0.02)}, ${c.surface})`,
          boxShadow: `inset 0 1px 0 ${withAlpha("#FFFFFF", theme.isDark ? 0.04 : 0.7)}, inset 0 -1px 1px ${withAlpha(c.textPrimary, 0.04)}`,
          color: c.textSecondary,
        }}
      >
        <Icon size={14} />
      </span>
      <span className="flex-1 text-[15px]" style={{ color: c.textPrimary }}>{label}</span>
      {value && <span className="text-sm" style={{ color: c.muted }}>{value}</span>}
      <ChevronRight size={15} className="shrink-0" style={{ color: c.disabled }} />
    </button>
  );
}

function SettingsGroup({ title, children }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div className="mt-8 first:mt-0">
      {title && (
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] px-1 mb-2 sticky top-0 z-10 py-1 -mt-1" style={{ color: c.muted, background: c.background }}>
          {title}
        </div>
      )}
      {/* Faint gradient + soft inset highlight along the top edge, on top of
          the existing border/shadow — a slightly molded panel instead of a
          flat white card, without changing its bounds, radius, or border. */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: `1px solid ${c.border}`,
          background: `linear-gradient(180deg, ${lighten(c.card, 0.015)}, ${c.card})`,
          boxShadow: `${theme.shadows.low}, inset 0 1px 0 ${withAlpha("#FFFFFF", theme.isDark ? 0.03 : 0.8)}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SettingsPage({ onOpenCategory = () => {} }) {
  const open = (label) => () => onOpenCategory(label);
  return (
    <div className="px-4 pt-4 pb-10">
      <SettingsGroup title="Account">
        <SettingsRow icon={User} label="Account" onClick={open("Account")} />
        <SettingsRow icon={Shield} label="Subscription" value="Free" onClick={open("Subscription")} last />
      </SettingsGroup>

      <SettingsGroup title="General">
        <SettingsRow icon={Settings} label="General" onClick={open("General")} />
        <SettingsRow icon={Wallpaper} label="Theme Presets" onClick={open("Theme Presets")} />
        <SettingsRow icon={Bell} label="Notifications" onClick={open("Notifications")} last />
      </SettingsGroup>

      <SettingsGroup title="Study">
        <SettingsRow icon={Flame} label="Study Preferences" value="30 cards/day" onClick={open("Study Preferences")} />
        <SettingsRow icon={Bookmark} label="Flashcard Preferences" onClick={open("Flashcard Preferences")} />
        <SettingsRow icon={ListChecks} label="Quiz Preferences" onClick={open("Quiz Preferences")} />
        <SettingsRow icon={Moon} label="Review Preferences" value="8:00 PM" onClick={open("Review Preferences")} last />
      </SettingsGroup>

      <SettingsGroup title="Presets">
        <SettingsRow icon={SlidersHorizontal} label="Study Presets" onClick={open("Study Presets")} />
        <SettingsRow icon={Bookmark} label="Flashcard Presets" onClick={open("Flashcard Presets")} />
        <SettingsRow icon={ListChecks} label="Quiz Presets" onClick={open("Quiz Presets")} />
        <SettingsRow icon={Clock} label="Review Presets" onClick={open("Review Presets")} />
        <SettingsRow icon={Palette} label="Appearance Presets" onClick={open("Appearance Presets")} />
        <SettingsRow icon={Bell} label="Notification Presets" onClick={open("Notification Presets")} last />
      </SettingsGroup>

      <SettingsGroup title="Privacy & Security">
        <SettingsRow icon={CheckSquare} label="Accessibility" onClick={open("Accessibility")} />
        <SettingsRow icon={Lock} label="Privacy" onClick={open("Privacy")} />
        <SettingsRow icon={Shield} label="Security" onClick={open("Security")} last />
      </SettingsGroup>

      <SettingsGroup title="Data">
        <SettingsRow icon={HardDrive} label="Storage" value="1.2 GB" onClick={open("Storage")} />
        <SettingsRow icon={Database} label="Backup" onClick={open("Backup")} />
        <SettingsRow icon={UploadCloud} label="Import" onClick={open("Import")} />
        <SettingsRow icon={DownloadCloud} label="Export" onClick={open("Export")} last />
      </SettingsGroup>

      <SettingsGroup title="Support">
        <SettingsRow icon={HelpCircle} label="Help Center" onClick={open("Help Center")} />
        <SettingsRow icon={Code2} label="Developer" onClick={open("Developer")} />
        <SettingsRow icon={FileBadge2} label="Licenses" onClick={open("Licenses")} />
        <SettingsRow icon={Info} label="About" onClick={open("About")} last />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow icon={LogOut} label="Log Out" last />
      </SettingsGroup>
    </div>
  );
}

/* ============================================================
   SECTION 8 — CHROME (header / drawer)
   ============================================================ */

// The app's persistent top bar for every non-Home page. Profile is
// deliberately NOT reachable from here — the Drawer (mobile) and the
// Gutter rail (desktop) are the only two entry points to Profile, so there
// is exactly one shortcut per surface instead of a Profile button bolted
// onto every header. Back moves up one level inside a drill-down; Menu
// always reopens the global navigation drawer, keeping every page feeling
// like part of one connected app rather than a standalone screen.
// Single icon on the left, never two. Top-level pages (Home, Courses,
// Notes, ...) show Menu so the drawer is always reachable; once the user
// has drilled into a hierarchy, that same slot becomes Back so they can
// step up one level at a time. The two never coexist.
function Header({ screen, title, editMode, showBack, onBack, onMenu, onDone, rightAction }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const resolvedTitle = title || getNavLabel(screen);
  return (
    <div
      className="flex items-center justify-between h-14 px-3 shrink-0 z-30"
      style={{ background: withAlpha(c.surface, 0.9), backdropFilter: "blur(8px)", borderBottom: `1px solid ${c.border}` }}
    >
      {showBack ? (
        <button onClick={onBack} className="pui-lift active:scale-90" style={{ padding: theme.spacing.sm, borderRadius: theme.radius.pill, color: c.textSecondary }} aria-label="Back">
          <ChevronLeft size={21} />
        </button>
      ) : (
        <button onClick={onMenu} className="pui-lift active:scale-90" style={{ padding: theme.spacing.sm, borderRadius: theme.radius.pill, color: c.textSecondary }} aria-label="Menu">
          <Menu size={20} />
        </button>
      )}

      <div className="flex items-center" style={{ gap: theme.spacing.xs }}>
        <span
          aria-hidden="true"
          className="rounded-full shrink-0"
          style={{ width: 5, height: 16, background: `linear-gradient(180deg, ${lighten(c.primary, 0.1)}, ${c.primary})` }}
        />
        <Text variant="title">{resolvedTitle}</Text>
      </div>

      {/* Prompt 10C #1 — the App Bar is navigation-only (Back/Menu, title,
          and edit mode's Done button). Page-level actions like Appearance's
          "Reset to defaults" now live in that page's own content header
          instead of competing with the title here. `rightAction` stays
          available as a generic slot for any future header-level action
          that genuinely belongs to navigation chrome, not to a page. */}
      {editMode ? (
        <Button variant="primary" size="sm" onClick={onDone}>Done</Button>
      ) : rightAction ? (
        rightAction
      ) : (
        <span className="w-9 h-9" aria-hidden="true" />
      )}
    </div>
  );
}

// The homepage's identity row. Deliberately NOT a boxed/material header like
// the study pages get — it sits directly on the workspace background so
// the wordmark reads as the app's logo rather than a page title.
//
// TEMP (dev-only): the hamburger button below is a mobile stand-in for the
// persistent Gutter's menu button, which is hidden below the md breakpoint.
// It opens the same Drawer via the same onMenu handler — remove once the
// preview environment can render the desktop rail.
// Home's top bar also drops the Profile shortcut — Menu (always visible
// here, not just below md) and Search are the only two entry points, same
// as every other page's header.
// Section 10 — Pull to Refresh: tracked manually off touch events rather
// than the browser/OS default pull-to-refresh (which reloads the whole
// page and looks nothing like the app) so the indicator can be Plug's own
// accent-colored mark. Only arms when the scroll container is already at
// its top — pulling down mid-scroll just scrolls, same as everywhere else.
function usePullToRefresh(ref, onRefresh) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const s = useRef({ startY: null, pulling: false });
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const THRESHOLD = 64;

    const onTouchStart = (e) => {
      // The hero carousel handles its own touch gestures (swipe/snap).
      // Without this guard, a touch starting on the hero — which sits at
      // scrollTop 0, the same condition this checks — would be processed
      // by BOTH this hook and the carousel at once: this hook could start
      // dragging the whole page down as a pull-to-refresh gesture while
      // the carousel is also mid-swipe, and releasing would snap the page
      // back via its own transition, effectively eating the user's next
      // scroll attempt. Ignoring hero-originated touches here removes
      // that conflict at the source instead of patching the symptom.
      if (e.target && e.target.closest && e.target.closest("[data-hero-carousel]")) return;
      if (el.scrollTop <= 0) { s.current.startY = e.touches[0].clientY; s.current.pulling = true; }
    };
    const onTouchMove = (e) => {
      if (!s.current.pulling || s.current.startY == null) return;
      const dy = e.touches[0].clientY - s.current.startY;
      if (dy > 0 && el.scrollTop <= 0) setPull(Math.min(dy * 0.5, 88));
      else s.current.pulling = false;
    };
    const onTouchEnd = () => {
      const wasPulling = s.current.pulling;
      setPull((p) => {
        if (wasPulling && p > THRESHOLD) {
          setRefreshing(true);
          Promise.resolve(onRefreshRef.current?.()).finally(() => {
            setTimeout(() => setRefreshing(false), 550);
          });
        }
        return 0;
      });
      s.current.pulling = false;
      s.current.startY = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref]);

  return { pull, refreshing };
}

function PullSpinner({ pull, refreshing }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const progress = Math.min(pull / 64, 1);
  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: 44,
        opacity: refreshing ? 1 : progress,
        transition: refreshing ? "none" : "opacity 120ms ease",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 30,
          height: 30,
          borderRadius: "9999px",
          background: c.surface,
          boxShadow: theme.shadows.medium,
          border: `1px solid ${c.border}`,
          transform: `scale(${refreshing ? 1 : 0.6 + progress * 0.4})`,
        }}
      >
        <RotateCcw
          size={14}
          style={{
            color: c.primary,
            transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
            animation: refreshing && !theme.reducedMotion ? "pui-pull-spin 700ms linear infinite" : "none",
          }}
        />
      </div>
    </div>
  );
}

// Wraps Home's scroll container with pull-to-refresh — its own component
// (rather than inline in AppShell) since it needs useToast/useTheme. The
// spinner lives INSIDE the same element that translates (an in-flow child
// sitting at a matching negative top-margin, clipped out of view by the
// wrapper's overflow:hidden until the content shifts down), so it can
// never drift out of alignment with the content the way a separately
// floating/absolutely-positioned indicator could. The wrapper itself
// carries the app's real background, so pulling down reveals themed
// background — never blank/unstyled space — in both Light and Dark Mode.
function HomeScrollArea({ scrollRef, board }) {
  const { theme } = useTheme();
  const { show } = useToast();
  const { pull, refreshing } = usePullToRefresh(scrollRef, () => show("Up to date"));
  const offset = refreshing ? 44 : pull;
  return (
    <div className="flex-1 relative overflow-hidden" style={{ background: theme.colors.background }}>
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto overscroll-contain pui-scroll"
        style={{
          transform: offset > 0 ? `translateY(${offset}px)` : "none",
          transition: refreshing || pull > 0 ? "none" : "transform 200ms ease",
        }}
      >
        <div style={{ marginTop: -44 }}>
          <PullSpinner pull={pull} refreshing={refreshing} />
        </div>
        <HomePage board={board} />
      </div>
    </div>
  );
}

function HomeTopBar({ onSearch, onMenu, editMode, onDone }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <div className="flex items-center h-14 px-4 shrink-0">
      <button onClick={onMenu} className="pui-lift active:scale-90 -ml-2 mr-1" style={{ padding: theme.spacing.sm, borderRadius: theme.radius.pill, color: c.textPrimary }} aria-label="Menu">
        <Menu size={22} />
      </button>
      <span className="font-bold text-[32px] tracking-[-0.03em] leading-none" style={{ color: c.textPrimary, fontFamily: "var(--font-family)" }}>
        The Plug
      </span>
      <div className="flex-1" />
      {editMode ? (
        <Button variant="primary" size="sm" onClick={onDone}>Done</Button>
      ) : (
        <button onClick={onSearch} className="pui-lift active:scale-90 -mr-2" style={{ padding: theme.spacing.sm, borderRadius: theme.radius.pill, color: c.textSecondary }} aria-label="Search">
          <Search size={19} />
        </button>
      )}
    </div>
  );
}

// PERSISTENT APPLICATION RAIL — a direct flex child of <App>, a sibling of
// MainContent, and never a child of <Drawer>. It spans the full viewport
// height on its own (not "however tall its content is"), sits at a fixed
// 72px, and has no transform/transition/animation on it anywhere — it is
// structural chrome, not a panel that opens or closes. The drawer slides
// out immediately to its right and never covers it.
function Gutter({ onOpenMenu, onOpenProfile, screen }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const activeIndex = NAV_ITEMS.findIndex((n) => n.id === screen);
  return (
    <div
      className="hidden md:flex shrink-0 flex-col items-center pt-5 pb-5 z-20"
      style={{
        width: GUTTER_W,
        height: "100vh",
        background: theme.isDark
          ? `linear-gradient(180deg, ${lighten(c.surface, 0.015)}, ${c.surface})`
          : c.surface,
        borderRight: `1px solid ${c.border}`,
        // A cleaner separation from the content it sits beside — a real cast
        // shadow in Dark Mode (where a hairline border alone reads faintly),
        // nothing extra in Light Mode where the border already does the job.
        boxShadow: theme.isDark ? `4px 0 24px ${withAlpha("#000000", 0.28)}` : "none",
      }}
    >
      <div
        className="pui-press flex items-center justify-center shrink-0"
        style={{
          width: 32, height: 32,
          borderRadius: theme.radius.sm,
          background: `linear-gradient(180deg, ${lighten(c.primary, 0.08)}, ${c.primary})`,
          "--pui-depth": "2px",
          "--pui-depth-color": darken(c.primary, 0.2),
          marginBottom: 2,
        }}
      >
        <span className="text-[13px] font-bold tracking-tight" style={{ color: c.onAccent }}>P</span>
      </div>

      <div className="w-6 border-t mt-5 mb-4" style={{ borderColor: c.border }} />

      <button onClick={onOpenMenu} className="pui-lift active:scale-90" style={{ padding: theme.spacing.sm, borderRadius: theme.radius.md, color: c.textSecondary }} aria-label="Menu">
        <Menu size={19} />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {NAV_ITEMS.map((item, i) => (
          <div
            key={item.id}
            className="rounded-full pui-lift"
            style={{
              width: 6,
              height: 6,
              transform: i === activeIndex ? "scale(1)" : "scale(0.5)",
              background: i === activeIndex ? c.primary : c.disabled,
              boxShadow: i === activeIndex && theme.isDark ? `0 0 0 3px ${withAlpha(c.primary, 0.16)}` : "none",
            }}
          />
        ))}
      </div>

      <button
        onClick={onOpenProfile}
        className="pui-lift active:scale-90"
        style={{ padding: theme.spacing.sm, borderRadius: theme.radius.md, color: screen === "profile" ? c.primary : c.textSecondary }}
        aria-label="Profile"
      >
        <User size={18} />
      </button>
    </div>
  );
}

// A small "eyebrow" label matching SectionHeading's rhythm, but without the
// trailing rule — used to separate groups inside the search results list.
function SearchGroupLabel({ children }) {
  const { theme } = useTheme();
  return (
    <div className="px-2.5 pt-4 pb-1.5 first:pt-2">
      <Text variant="caption" weight={700} color={theme.colors.muted} style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {children}
      </Text>
    </div>
  );
}

function SearchResultRow({ icon: Icon, label, meta, onClick }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center pui-lift active:scale-[0.99] text-left"
      style={{ gap: theme.spacing.sm, padding: `${theme.spacing.sm}px ${theme.spacing.sm}px`, borderRadius: theme.radius.md }}
    >
      <Icon size={15} style={{ color: c.disabled }} className="shrink-0" />
      <Text as="span" variant="body" color={c.textPrimary} className="flex-1 min-w-0 truncate">{label}</Text>
      {meta && <Text as="span" variant="caption" color={c.muted} className="shrink-0">{meta}</Text>}
    </button>
  );
}

// Section 12 — Recent Searches specifically get a horizontal strip capped
// to two visible pills rather than the vertical SearchResultRow list every
// other group in this overlay uses — short one-word-ish queries don't need
// a full-width row, and scrolling sideways through past searches (like a
// browser's recent-searches chips) reads faster than scanning a tall list.
function RecentSearchPill({ label, onClick }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { ripples, onPointerDown } = usePlugRipple();
  return (
    <button
      onClick={onClick}
      onPointerDown={onPointerDown}
      className="flex items-center pui-lift active:scale-[0.97] shrink-0 relative overflow-hidden"
      style={{
        gap: theme.spacing.xs,
        padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
        borderRadius: theme.radius.pill,
        background: c.background,
        border: `1px solid ${c.border}`,
        width: "calc(50% - 6px)",
        scrollSnapAlign: "start",
      }}
    >
      <Clock size={13} style={{ color: c.disabled }} className="shrink-0" />
      <Text as="span" variant="caption" weight={600} color={c.textPrimary} className="truncate">{label}</Text>
      <RippleLayer ripples={ripples} color={withAlpha(c.primary, 0.16)} />
    </button>
  );
}

// Real global search over SEARCH_INDEX. Empty state shows recents/quick
// actions instead of fake results; typing filters the whole index and
// groups whatever matches — one interface for every searchable surface in
// the app instead of separate per-section search pages.
function SearchOverlay({ open, onClose, onNavigate }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const trimmed = query.trim().toLowerCase();
  const results = trimmed ? SEARCH_INDEX.filter((r) => r.label.toLowerCase().includes(trimmed)) : [];
  const grouped = results.reduce((acc, r) => {
    (acc[r.group] ||= []).push(r);
    return acc;
  }, {});

  const goToGroup = (group) => {
    onNavigate(GROUP_SCREEN_MAP[group] || "home");
    onClose();
  };

  return (
    <div
      className="fixed top-0 right-0 bottom-0 left-0 md:left-[72px] z-40 pointer-events-none"
      aria-hidden={!open}
    >
      {open && (
        <div
          className="absolute inset-0 pointer-events-auto"
          style={{ background: c.overlay, backdropFilter: "blur(2px)", transition: `opacity var(--motion-base) ease` }}
          onClick={onClose}
        />
      )}
      <div
        className="absolute top-0 left-0 w-full max-h-[85vh] overflow-y-auto pui-scroll"
        style={{
          background: withAlpha(c.surface, 0.97),
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${c.border}`,
          boxShadow: theme.shadows.high,
          transformOrigin: "top left",
          transform: open ? "scale(1) translateY(0)" : "scale(0.94) translateY(-16px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: `transform var(--motion-base) cubic-bezier(0.22,1,0.36,1), opacity var(--motion-fast) ease`,
        }}
      >
        <div className="flex items-center h-14 px-4 sticky top-0" style={{ gap: theme.spacing.sm, background: withAlpha(c.surface, 0.97), backdropFilter: "blur(10px)" }}>
          <Search size={17} style={{ color: c.textSecondary }} className="shrink-0" />
          <input
            autoFocus={open}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything"
            className="flex-1 bg-transparent outline-none text-[15px]"
            style={{ color: c.textPrimary, fontFamily: "var(--font-family)" }}
          />
          <button
            onClick={onClose}
            className="pui-lift active:scale-90 -mr-1.5"
            style={{ padding: theme.spacing.xs, borderRadius: theme.radius.pill, color: c.textSecondary }}
            aria-label="Close search"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-2.5 pb-4">
          {!trimmed ? (
            <>
              <SearchGroupLabel>Recent Searches</SearchGroupLabel>
              <div
                className="flex overflow-x-auto px-2.5 pb-1 pui-scroll pui-edge-fade-x [&::-webkit-scrollbar]:hidden"
                style={{ gap: theme.spacing.sm, scrollSnapType: "x proximity" }}
              >
                {RECENT_SEARCHES.map((label) => (
                  <RecentSearchPill key={label} label={label} onClick={() => setQuery(label)} />
                ))}
              </div>

              <SearchGroupLabel>Recent Pages</SearchGroupLabel>
              {RECENT_PAGES.map((p) => (
                <SearchResultRow key={p.label} icon={p.icon} label={p.label} meta={p.group} onClick={() => goToGroup(p.group)} />
              ))}
            </>
          ) : Object.keys(grouped).length === 0 ? (
            <Text as="div" variant="body" color={c.muted} className="px-2.5 py-8 text-center">No results for "{query}"</Text>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <SearchGroupLabel>{group}</SearchGroupLabel>
                {items.map((r) => (
                  <SearchResultRow key={r.id} icon={r.icon} label={r.label} onClick={() => goToGroup(group)} />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Slide-out drawer — the temporary mobile stand-in for navigation. On
// desktop this same NAV_ITEMS list and profile entry point live in the
// permanent Gutter rail; this panel exists only because the rail is hidden
// below the md breakpoint, and its markup is shaped so that becoming an
// inline expanded sidebar later is a layout change, not a rebuild.
function Drawer({ open, screen, onNavigate, onProfile, onClose }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <>
      {open && (
        <div className="fixed top-0 right-0 bottom-0 left-0 md:left-[72px] z-40" onClick={onClose} style={{ transition: `opacity var(--motion-base) ease` }}>
          <div className="absolute inset-0" style={{ background: c.overlay, backdropFilter: "blur(2px)" }} />
        </div>
      )}
      <div
        className="fixed top-0 left-0 md:left-[72px] h-full w-[75%] max-w-xs z-50 flex flex-col"
        style={{
          background: c.surface,
          borderRight: `1px solid ${c.border}`,
          boxShadow: theme.shadows.floating,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: `transform var(--motion-base) cubic-bezier(0.22,1,0.36,1)`,
        }}
      >
        <div className="flex items-center h-14 px-3 shrink-0">
          <button onClick={onClose} className="pui-lift active:scale-90" style={{ padding: theme.spacing.sm, borderRadius: theme.radius.pill, color: c.textSecondary }} aria-label="Close menu">
            <Menu size={21} />
          </button>
        </div>

        <button
          onClick={() => { onProfile(); onClose(); }}
          className="flex items-center pui-lift active:scale-[0.98] text-left"
          style={{
            gap: theme.spacing.md,
            margin: `0 ${theme.spacing.md}px ${theme.spacing.md}px`,
            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
            borderRadius: theme.radius.lg,
            border: `1px solid ${c.border}`,
            background: c.card,
          }}
        >
          <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 36, height: 36, background: c.background }}>
            <User size={17} style={{ color: c.textSecondary }} />
          </div>
          <div className="flex-1 min-w-0">
            <Text as="div" variant="body" weight={600} className="truncate">Learner</Text>
            <Text as="div" variant="caption" color={c.muted} className="truncate">View profile</Text>
          </div>
          <ChevronDown size={16} style={{ color: c.muted }} className="shrink-0" />
        </button>

        <div style={{ margin: `0 ${theme.spacing.md}px ${theme.spacing.sm}px`, borderTop: `1px solid ${c.border}` }} />

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center pui-lift active:scale-[0.98] text-sm text-left"
                style={{
                  gap: theme.spacing.md,
                  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                  borderRadius: theme.radius.md,
                  background: active ? c.background : "transparent",
                  color: active ? c.textPrimary : c.textSecondary,
                  fontWeight: active ? 700 : 400,
                }}
              >
                <Icon size={18} style={{ color: active ? c.primary : c.muted }} />
                {item.label}
                {active && <span className="ml-auto rounded-full" style={{ width: 6, height: 6, background: c.primary }} />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   SECTION 8B — SCROLL RESTORATION
   One shared position table + one hook, applied to whichever
   single scroll container is currently mounted (Home's or the
   study-pages one). Keyed by screen — and by drill trail, so
   Courses and Courses → Pharmacology each keep their own offset
   independently. Lives for the app's lifetime in memory, so a
   real page refresh naturally clears it, matching "only reset on
   refresh or first open."
   ============================================================ */

const scrollPositions = {};

function useScrollRestoration(key, ref) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = scrollPositions[key] || 0;

    const onScroll = () => { scrollPositions[key] = el.scrollTop; };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [key, ref]);
}

/* ============================================================
   SECTION 9 — APP
   Owns navigation (screen, drawer) and the one widget board.
   Everything else is composition.
   ============================================================ */

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SavedSystemProvider>
          <MaterialResourceProvider>
            <AppShell />
          </MaterialResourceProvider>
        </SavedSystemProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

// Everything that used to live directly in App's default export — split out
// so App itself is just "mount the saved system, then render the shell."
function AppShell() {
  const { theme } = useTheme();
  const [screen, setScreen] = useState("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const board = useWidgetBoard();

  // Home renders its own FAB (edit-mode aware, tied to the widget board), so
  // it's excluded here. Profile, Settings, and Customization (Themes)
  // aren't creation contexts, so they don't get one either. Every other
  // page follows the same Header → Menu/Back → Content → FAB shape instead
  // of some pages having a floating "+" and others only a header button.
  const showGlobalFab = !["home", "profile", "settings", "customization"].includes(screen);

  // Drill-down state for whichever section is currently drilled into.
  // { screen: <nav id>, trail: [{ label }, ...] } — trail[0] is the root
  // item picked from that section's normal list page. Kept in App (rather
  // than per-page) so Header's back button and title can be drill-aware
  // without every page needing to know about navigation chrome.
  const [drill, setDrill] = useState(null);

  // Which Study Modes hub card (if any) is open — e.g. "flashcards",
  // "quiz". Lives here (not inside StudyPage) for the same reason drill
  // does: so the shared Header back-button and title can control and
  // reflect it, exactly like every other page's back navigation, instead
  // of Study needing its own in-page back control.
  const [studyMode, setStudyMode] = useState(null);
  const [openNote, setOpenNote] = useState(null);
  const [noteMenuOpen, setNoteMenuOpen] = useState(false);

  // Section 3 — Page Transitions: which way the last navigation moved, so
  // the content wrapper below can play a forward "push" animation or a
  // reversed "back" one. Forward covers any explicit jump to a new place
  // (top-level nav, drilling deeper); back covers the header's Back button
  // and jumping to an earlier breadcrumb.
  const [navDirection, setNavDirection] = useState("forward");

  // Any explicit navigation to a top-level screen (drawer, gutter, search,
  // header profile button) leaves drill state behind — drill only survives
  // while you're moving deeper inside the same section.
  const navigateToScreen = (id, direction = "forward") => {
    setNavDirection(direction);
    setScreen(id);
    setDrill(null);
    setStudyMode(null);
  };

  const startDrill = (sectionScreen, rootLabel) => {
    setNavDirection("forward");
    setDrill({ screen: sectionScreen, trail: [{ label: rootLabel }] });
  };
  const pushDrill = (node) => {
    setNavDirection("forward");
    setDrill((d) => (d ? { ...d, trail: [...d.trail, node] } : d));
  };
  const jumpDrill = (index) => {
    setNavDirection("back");
    setDrill((d) => (d ? { ...d, trail: d.trail.slice(0, index + 1) } : d));
  };

  const inDrill = drill && drill.screen === screen;
  const inStudyMode = screen === "study" && !!studyMode;
  const inEditor = screen === "notes" && !!openNote;

  const handleBack = () => {
    setNavDirection("back");
    // Note Editor sits one level below a Notes folder (Notes → Folder →
    // List of Notes → Note Editor), so closing it must come before
    // popping the folder drill state — otherwise Back from the editor
    // would skip straight past the folder listing.
    if (inEditor) {
      setOpenNote(null);
    } else if (inDrill) {
      if (drill.trail.length > 1) {
        setDrill((d) => ({ ...d, trail: d.trail.slice(0, -1) }));
      } else {
        setDrill(null);
      }
    } else if (inStudyMode) {
      setStudyMode(null);
    } else {
      navigateToScreen("home", "back");
    }
  };

  const studyModeLabel = inStudyMode ? STUDY_HUB_MODES.find((m) => m.id === studyMode)?.label : null;
  const headerTitle = inEditor
    ? (openNote.title || "Untitled note")
    : inDrill
    ? drill.trail[drill.trail.length - 1].label
    : inStudyMode
    ? studyModeLabel
    : getNavLabel(screen);

  // One key per distinct "place" the user can scroll: a top-level page on
  // its own, a specific depth within a drill-down, or the Note Editor
  // itself (kept distinct from its parent folder's key so switching
  // between a folder's note list and an open note doesn't reuse — and
  // fight over — the same scroll position).
  const scrollKey =
    screen === "home"
      ? "home"
      : inEditor
      ? `notes-editor:${openNote.id}`
      : inDrill
      ? `${screen}:${drill.trail.map((n) => n.label).join("/")}`
      : inStudyMode
      ? `${screen}:${studyMode}`
      : screen;
  const scrollRef = useRef(null);
  useScrollRestoration(scrollKey, scrollRef);

  return (
    <div
      className="fixed inset-0 flex overflow-hidden select-none"
      style={{
        touchAction: board.editMode ? "none" : "auto",
        background: theme.wallpaperCss || theme.colors.background,
        transition: theme.reducedMotion ? "none" : "background var(--motion-slow) ease",
      }}
    >
      <Gutter
        onOpenMenu={() => setDrawerOpen(true)}
        onOpenProfile={() => navigateToScreen("profile")}
        screen={screen}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {screen === "home" ? (
          <>
            <HomeTopBar
              onSearch={() => setSearchOpen(true)}
              onMenu={() => setDrawerOpen(true)}
              editMode={board.editMode}
              onDone={board.exitEditMode}
            />
            <HomeScrollArea scrollRef={scrollRef} board={board} />
          </>
        ) : (
          <>
            <Header
              screen={screen}
              title={headerTitle}
              editMode={board.editMode}
              showBack={inDrill || inStudyMode || inEditor}
              onBack={handleBack}
              onMenu={() => setDrawerOpen(true)}
              onDone={board.exitEditMode}
              rightAction={inEditor ? (
                <button
                  onClick={() => setNoteMenuOpen(true)}
                  className="pui-lift active:scale-90"
                  style={{ padding: theme.spacing.sm, borderRadius: theme.radius.pill, color: theme.colors.textSecondary }}
                  aria-label="More actions"
                >
                  <MoreVertical size={18} />
                </button>
              ) : undefined}
            />
            {inEditor && (
              <ContextMenuSheet
                itemLabel={noteMenuOpen ? openNote?.title : null}
                entity={openNote ? { type: "note", id: openNote.id, label: openNote.title, icon: FileText, meta: openNote.folder } : null}
                onClose={() => setNoteMenuOpen(false)}
              />
            )}
            <div
              ref={scrollRef}
              key={scrollKey}
              className="flex-1 overflow-y-auto overscroll-contain pui-scroll"
              style={{
                animation: screen === "settings"
                  ? `pui-fade-in var(--motion-base) ease`
                  : `${navDirection === "back" ? "pui-screen-in-back" : "pui-screen-in"} var(--motion-base) ease-out`,
              }}
            >
              {inEditor ? (
                // Checked first: the Note Editor is one level below the
                // folder listing (Notes → Folder → List of Notes → Note
                // Editor), so an open note always wins over the folder
                // view underneath it — never a nested Notes page.
                <NoteEditorPage note={openNote} onBack={() => setOpenNote(null)} />
              ) : inDrill && screen === "notes" ? (
                // A Notes folder is a real file directory, not a Course —
                // it never goes through the generic Sections/Pages
                // DrillDownExplorer used by every other section below.
                <NotesFolderPage
                  folderLabel={drill.trail[drill.trail.length - 1].label}
                  notes={SAMPLE_NOTES.filter((n) => n.folder === drill.trail[drill.trail.length - 1].label)}
                  onNewNote={() =>
                    setOpenNote({
                      id: `new-${Date.now()}`,
                      title: "",
                      folder: drill.trail[drill.trail.length - 1].label,
                      time: "just now",
                    })
                  }
                  onOpenNote={(note) => setOpenNote(note)}
                />
              ) : inDrill && HIERARCHY_REGISTRY[screen] ? (
                <DrillDownExplorer
                  config={HIERARCHY_REGISTRY[screen]}
                  trail={drill.trail}
                  onDrill={pushDrill}
                  onJump={jumpDrill}
                />
              ) : (
                <>
                  {screen === "profile" && <ProfilePage />}
                  {screen === "courses" && <CoursesPage onOpenCourse={(label) => startDrill("courses", label)} />}
                  {screen === "notes" && (
                    <NotesPage
                      onOpenFolder={(label) => startDrill("notes", label)}
                      onEditNote={(note) => setOpenNote(note)}
                    />
                  )}
                  {screen === "study" && (
                    <StudyPage
                      onOpenItem={(label) => startDrill("study", label)}
                      activeMode={studyMode}
                      setActiveMode={setStudyMode}
                    />
                  )}
                  {screen === "review" && <ReviewPage onOpenSession={(label) => startDrill("review", label)} />}
                  {screen === "progress" && <ProgressPage onOpenSubject={(label) => startDrill("progress", label)} />}
                  {screen === "saved" && <SavedPage onOpenGroup={(label) => startDrill("saved", label)} />}
                  {screen === "settings" && <SettingsPage onOpenCategory={(label) => startDrill("settings", label)} />}
                  {screen === "customization" && <AppearancePage />}
                </>
              )}
            </div>
            {showGlobalFab && <FloatingActionButton onClick={() => setFabOpen(true)} />}
            <CreateSheet open={fabOpen} onClose={() => setFabOpen(false)} />
          </>
        )}
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={navigateToScreen} />

      <Drawer
        open={drawerOpen}
        screen={screen}
        onNavigate={(id) => { navigateToScreen(id); setDrawerOpen(false); }}
        onProfile={() => navigateToScreen("profile")}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
