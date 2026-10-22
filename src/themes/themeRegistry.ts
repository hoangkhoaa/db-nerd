import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export type AppThemeId =
  | 'default-dark'
  | 'default-light'
  | 'monokai-pro'
  | 'dracula'
  | 'one-dark'
  | 'material-ocean'
  | 'nord'
  | 'catppuccin-mocha'
  | 'tokyo-night'
  | 'github-dark'
  | 'solarized-dark';

export interface ThemeDefinition {
  id: AppThemeId;
  name: string;
  category: 'dark' | 'light';
  description: string;
  accentColor: string;
  bgCanvas: string;
  bgPanel: string;
  bgDarker: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  swatches: string[]; // 4 representative color chips
  sqlHighlight: HighlightStyle;
  sqlTheme: Extension;
}

// Helper to create a consistent CodeMirror 6 editor theme
function createCmTheme(params: {
  dark: boolean;
  bg: string;
  fg: string;
  caret: string;
  selection: string;
  selectionMatch: string;
  gutterBg: string;
  gutterFg: string;
  gutterBorder: string;
  activeLine: string;
  activeLineGutter: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipSelected: string;
  tooltipSelectedFg: string;
}) {
  return EditorView.theme(
    {
      '&': {
        color: params.fg,
        backgroundColor: params.bg,
        fontSize: '13px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        height: '100%',
      },
      '.cm-content': {
        caretColor: params.caret,
        padding: '10px 0',
        lineHeight: '1.6',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: params.caret,
        borderLeftWidth: '2px',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
        backgroundColor: `${params.selection} !important`,
      },
      '.cm-selectionLayer .cm-selectionBackground': {
        backgroundColor: `${params.selection} !important`,
      },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
        backgroundColor: `${params.selection} !important`,
      },
      '::selection, .cm-content ::selection': {
        backgroundColor: `${params.selection} !important`,
      },
      '&:not(.cm-focused) .cm-selectionBackground': {
        backgroundColor: `${params.selection} !important`,
        opacity: '0.6',
      },
      '.cm-selectionMatch': {
        backgroundColor: params.selectionMatch,
        outline: `1px solid ${params.caret}60`,
        borderRadius: '2px',
      },
      '.cm-gutters': {
        backgroundColor: params.gutterBg,
        color: params.gutterFg,
        borderRight: `1px solid ${params.gutterBorder}`,
        paddingRight: '6px',
      },
      '.cm-activeLine': {
        backgroundColor: params.activeLine,
      },
      '.cm-activeLineGutter': {
        backgroundColor: params.activeLineGutter,
        color: params.fg,
        fontWeight: 'bold',
      },
      '.cm-scroller': {
        overflow: 'auto',
      },
      '.cm-tooltip': {
        backgroundColor: `${params.tooltipBg} !important`,
        border: `1px solid ${params.tooltipBorder} !important`,
        borderRadius: '8px !important',
        boxShadow: params.dark
          ? '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05) !important'
          : '0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05) !important',
        overflow: 'hidden !important',
        zIndex: '100 !important',
      },
      '.cm-tooltip.cm-tooltip-autocomplete': {
        '& > ul': {
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '12px',
          maxHeight: '260px',
          minWidth: '240px',
          padding: '4px',
        },
        '& > ul > li': {
          padding: '5px 8px',
          borderRadius: '5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: params.fg,
          cursor: 'pointer',
        },
        '& > ul > li[aria-selected]': {
          backgroundColor: `${params.tooltipSelected} !important`,
          color: `${params.tooltipSelectedFg} !important`,
        },
        '& > ul > li:hover': {
          backgroundColor: `${params.tooltipSelected}80`,
        },
      },
      '.cm-completionLabel': {
        fontWeight: '600',
        color: params.fg,
      },
      '.cm-completionDetail': {
        marginLeft: 'auto',
        paddingLeft: '12px',
        color: params.gutterFg,
        fontSize: '11px',
        fontStyle: 'normal',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      },
      '.cm-completionInfo': {
        backgroundColor: params.dark ? '#090d16' : '#f8fafc',
        borderLeft: `1px solid ${params.tooltipBorder}`,
        padding: '8px 12px',
        color: params.fg,
        fontSize: '11px',
        maxWidth: '300px',
      },
      '.cm-completionIcon': {
        width: '14px',
        opacity: '0.9',
        marginRight: '2px',
      },
    },
    { dark: params.dark }
  );
}

// 1. Default Dark (TablePlus Slate)
const defaultDarkHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#38bdf8', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#c084fc', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#fbbf24' },
  { tag: t.string, color: '#4ade80' },
  { tag: t.number, color: '#f87171', fontWeight: 'semibold' },
  { tag: t.bool, color: '#f43f5e', fontWeight: 'bold' },
  { tag: t.null, color: '#f43f5e', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#fbbf24', fontWeight: 'bold' },
  { tag: t.operator, color: '#93c5fd' },
  { tag: t.punctuation, color: '#94a3b8' },
  { tag: t.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.variableName, color: '#f8fafc' },
]);

const defaultDarkTheme = createCmTheme({
  dark: true,
  bg: '#020617',
  fg: '#f8fafc',
  caret: '#38bdf8',
  selection: 'rgba(37, 99, 235, 0.45)',
  selectionMatch: 'rgba(56, 189, 248, 0.25)',
  gutterBg: '#020617',
  gutterFg: '#475569',
  gutterBorder: '#1e293b',
  activeLine: '#0f172a60',
  activeLineGutter: '#0f172a',
  tooltipBg: '#0f172a',
  tooltipBorder: '#334155',
  tooltipSelected: '#1e293b',
  tooltipSelectedFg: '#38bdf8',
});

// 2. Default Light (2026 Alabaster Pastel)
const defaultLightHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#2563eb', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#7c3aed', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#d97706' },
  { tag: t.string, color: '#059669' },
  { tag: t.number, color: '#ea580c', fontWeight: 'semibold' },
  { tag: t.bool, color: '#e11d48', fontWeight: 'bold' },
  { tag: t.null, color: '#e11d48', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#6366f1', fontWeight: 'bold' },
  { tag: t.operator, color: '#3b82f6' },
  { tag: t.punctuation, color: '#64748b' },
  { tag: t.comment, color: '#94a3b8', fontStyle: 'italic' },
  { tag: t.variableName, color: '#1e293b' },
]);

const defaultLightTheme = createCmTheme({
  dark: false,
  bg: '#ffffff',
  fg: '#1e293b',
  caret: '#2563eb',
  selection: '#eff6ff',
  selectionMatch: 'rgba(37, 99, 235, 0.15)',
  gutterBg: '#f8fafd',
  gutterFg: '#94a3b8',
  gutterBorder: '#e2e8f0',
  activeLine: '#f8fafd',
  activeLineGutter: '#eff6ff',
  tooltipBg: '#ffffff',
  tooltipBorder: '#cbd5e1',
  tooltipSelected: '#e0f2fe',
  tooltipSelectedFg: '#0369a1',
});

// 3. Monokai Pro
const monokaiProHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#ff6188', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#78dce8', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#fc9867' },
  { tag: t.string, color: '#ffd866' },
  { tag: t.number, color: '#ab9df2', fontWeight: 'semibold' },
  { tag: t.bool, color: '#fc9867', fontWeight: 'bold' },
  { tag: t.null, color: '#fc9867', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#a9dc76', fontWeight: 'bold' },
  { tag: t.operator, color: '#ff6188' },
  { tag: t.punctuation, color: '#939293' },
  { tag: t.comment, color: '#727072', fontStyle: 'italic' },
  { tag: t.variableName, color: '#fcfcfa' },
]);

const monokaiProTheme = createCmTheme({
  dark: true,
  bg: '#2d2a2e',
  fg: '#fcfcfa',
  caret: '#ffd866',
  selection: 'rgba(255, 216, 102, 0.28)',
  selectionMatch: 'rgba(255, 216, 102, 0.18)',
  gutterBg: '#221f22',
  gutterFg: '#727072',
  gutterBorder: '#403e41',
  activeLine: '#383539',
  activeLineGutter: '#403e41',
  tooltipBg: '#221f22',
  tooltipBorder: '#403e41',
  tooltipSelected: '#383539',
  tooltipSelectedFg: '#ffd866',
});

// 4. Dracula Official
const draculaHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#ff79c6', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#8be9fd', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#ffb86c' },
  { tag: t.string, color: '#f1fa8c' },
  { tag: t.number, color: '#bd93f9', fontWeight: 'semibold' },
  { tag: t.bool, color: '#bd93f9', fontWeight: 'bold' },
  { tag: t.null, color: '#bd93f9', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#50fa7b', fontWeight: 'bold' },
  { tag: t.operator, color: '#ff79c6' },
  { tag: t.punctuation, color: '#f8f8f2' },
  { tag: t.comment, color: '#6272a4', fontStyle: 'italic' },
  { tag: t.variableName, color: '#f8f8f2' },
]);

const draculaTheme = createCmTheme({
  dark: true,
  bg: '#282a36',
  fg: '#f8f8f2',
  caret: '#ff79c6',
  selection: 'rgba(68, 71, 90, 0.8)',
  selectionMatch: 'rgba(189, 147, 249, 0.25)',
  gutterBg: '#21222c',
  gutterFg: '#6272a4',
  gutterBorder: '#44475a',
  activeLine: '#44475a50',
  activeLineGutter: '#44475a',
  tooltipBg: '#21222c',
  tooltipBorder: '#44475a',
  tooltipSelected: '#44475a',
  tooltipSelectedFg: '#50fa7b',
});

// 5. One Dark Pro (Atom)
const oneDarkHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#c678dd', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#56b6c2', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#e5c07b' },
  { tag: t.string, color: '#98c379' },
  { tag: t.number, color: '#d19a66', fontWeight: 'semibold' },
  { tag: t.bool, color: '#d19a66', fontWeight: 'bold' },
  { tag: t.null, color: '#d19a66', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#61afef', fontWeight: 'bold' },
  { tag: t.operator, color: '#56b6c2' },
  { tag: t.punctuation, color: '#abb2bf' },
  { tag: t.comment, color: '#5c6370', fontStyle: 'italic' },
  { tag: t.variableName, color: '#e06c75' },
]);

const oneDarkTheme = createCmTheme({
  dark: true,
  bg: '#282c34',
  fg: '#abb2bf',
  caret: '#528bff',
  selection: 'rgba(61, 107, 186, 0.45)',
  selectionMatch: 'rgba(97, 175, 239, 0.25)',
  gutterBg: '#21252b',
  gutterFg: '#5c6370',
  gutterBorder: '#3e4451',
  activeLine: '#2c313c',
  activeLineGutter: '#3e4451',
  tooltipBg: '#21252b',
  tooltipBorder: '#3e4451',
  tooltipSelected: '#2c313c',
  tooltipSelectedFg: '#61afef',
});

// 6. Material Ocean
const materialOceanHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#89ddff', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#82aaff', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#ffcb6b' },
  { tag: t.string, color: '#c3e88d' },
  { tag: t.number, color: '#f78c6c', fontWeight: 'semibold' },
  { tag: t.bool, color: '#ff5370', fontWeight: 'bold' },
  { tag: t.null, color: '#ff5370', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#82aaff', fontWeight: 'bold' },
  { tag: t.operator, color: '#89ddff' },
  { tag: t.punctuation, color: '#89ddff' },
  { tag: t.comment, color: '#546e7a', fontStyle: 'italic' },
  { tag: t.variableName, color: '#eeffff' },
]);

const materialOceanTheme = createCmTheme({
  dark: true,
  bg: '#0f111a',
  fg: '#eeffff',
  caret: '#80cbc4',
  selection: 'rgba(130, 170, 255, 0.35)',
  selectionMatch: 'rgba(128, 203, 196, 0.25)',
  gutterBg: '#090b10',
  gutterFg: '#546e7a',
  gutterBorder: '#1a1c25',
  activeLine: '#1a1c2560',
  activeLineGutter: '#1f2233',
  tooltipBg: '#090b10',
  tooltipBorder: '#1a1c25',
  tooltipSelected: '#1a1c25',
  tooltipSelectedFg: '#80cbc4',
});

// 7. Nord (Arctic)
const nordHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#81a1c1', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#88c0d0', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#ebcb8b' },
  { tag: t.string, color: '#a3be8c' },
  { tag: t.number, color: '#b48ead', fontWeight: 'semibold' },
  { tag: t.bool, color: '#bf616a', fontWeight: 'bold' },
  { tag: t.null, color: '#bf616a', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#88c0d0', fontWeight: 'bold' },
  { tag: t.operator, color: '#81a1c1' },
  { tag: t.punctuation, color: '#eceff4' },
  { tag: t.comment, color: '#616e88', fontStyle: 'italic' },
  { tag: t.variableName, color: '#eceff4' },
]);

const nordTheme = createCmTheme({
  dark: true,
  bg: '#2e3440',
  fg: '#eceff4',
  caret: '#88c0d0',
  selection: 'rgba(67, 76, 94, 0.85)',
  selectionMatch: 'rgba(136, 192, 208, 0.25)',
  gutterBg: '#242933',
  gutterFg: '#616e88',
  gutterBorder: '#3b4252',
  activeLine: '#383e4a',
  activeLineGutter: '#3b4252',
  tooltipBg: '#242933',
  tooltipBorder: '#3b4252',
  tooltipSelected: '#383e4a',
  tooltipSelectedFg: '#88c0d0',
});

// 8. Catppuccin Mocha
const catppuccinMochaHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#cba6f7', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#89dceb', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#fab387' },
  { tag: t.string, color: '#a6e3a1' },
  { tag: t.number, color: '#fab387', fontWeight: 'semibold' },
  { tag: t.bool, color: '#f38ba8', fontWeight: 'bold' },
  { tag: t.null, color: '#f38ba8', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#89b4fa', fontWeight: 'bold' },
  { tag: t.operator, color: '#89dceb' },
  { tag: t.punctuation, color: '#cdd6f4' },
  { tag: t.comment, color: '#6c7086', fontStyle: 'italic' },
  { tag: t.variableName, color: '#cdd6f4' },
]);

const catppuccinMochaTheme = createCmTheme({
  dark: true,
  bg: '#1e1e2e',
  fg: '#cdd6f4',
  caret: '#f5c2e7',
  selection: 'rgba(88, 91, 112, 0.65)',
  selectionMatch: 'rgba(203, 166, 247, 0.25)',
  gutterBg: '#181825',
  gutterFg: '#6c7086',
  gutterBorder: '#313244',
  activeLine: '#252538',
  activeLineGutter: '#313244',
  tooltipBg: '#181825',
  tooltipBorder: '#313244',
  tooltipSelected: '#252538',
  tooltipSelectedFg: '#cba6f7',
});

// 9. Tokyo Night
const tokyoNightHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#bb9af7', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#7dcfff', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#ff9e64' },
  { tag: t.string, color: '#9ece6a' },
  { tag: t.number, color: '#ff9e64', fontWeight: 'semibold' },
  { tag: t.bool, color: '#f7768e', fontWeight: 'bold' },
  { tag: t.null, color: '#f7768e', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#7aa2f7', fontWeight: 'bold' },
  { tag: t.operator, color: '#89ddff' },
  { tag: t.punctuation, color: '#c0caf5' },
  { tag: t.comment, color: '#565f89', fontStyle: 'italic' },
  { tag: t.variableName, color: '#c0caf5' },
]);

const tokyoNightTheme = createCmTheme({
  dark: true,
  bg: '#1a1b26',
  fg: '#c0caf5',
  caret: '#7aa2f7',
  selection: 'rgba(40, 52, 87, 0.85)',
  selectionMatch: 'rgba(122, 162, 247, 0.25)',
  gutterBg: '#16161e',
  gutterFg: '#565f89',
  gutterBorder: '#292e42',
  activeLine: '#24283b',
  activeLineGutter: '#292e42',
  tooltipBg: '#16161e',
  tooltipBorder: '#292e42',
  tooltipSelected: '#24283b',
  tooltipSelectedFg: '#7aa2f7',
});

// 10. GitHub Dark
const githubDarkHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#ff7b72', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#79c0ff', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#d2a8ff' },
  { tag: t.string, color: '#a5d6ff' },
  { tag: t.number, color: '#79c0ff', fontWeight: 'semibold' },
  { tag: t.bool, color: '#ff7b72', fontWeight: 'bold' },
  { tag: t.null, color: '#ff7b72', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#d2a8ff', fontWeight: 'bold' },
  { tag: t.operator, color: '#79c0ff' },
  { tag: t.punctuation, color: '#c9d1d9' },
  { tag: t.comment, color: '#8b949e', fontStyle: 'italic' },
  { tag: t.variableName, color: '#c9d1d9' },
]);

const githubDarkTheme = createCmTheme({
  dark: true,
  bg: '#0d1117',
  fg: '#c9d1d9',
  caret: '#58a6ff',
  selection: 'rgba(56, 139, 253, 0.4)',
  selectionMatch: 'rgba(88, 166, 255, 0.25)',
  gutterBg: '#010409',
  gutterFg: '#8b949e',
  gutterBorder: '#21262d',
  activeLine: '#161b22',
  activeLineGutter: '#21262d',
  tooltipBg: '#0d1117',
  tooltipBorder: '#30363d',
  tooltipSelected: '#161b22',
  tooltipSelectedFg: '#58a6ff',
});

// 11. Solarized Dark
const solarizedDarkHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#859900', fontWeight: 'bold' },
  { tag: t.standard(t.name), color: '#268bd2', fontWeight: 'bold' },
  { tag: t.special(t.string), color: '#b58900' },
  { tag: t.string, color: '#2aa198' },
  { tag: t.number, color: '#d33682', fontWeight: 'semibold' },
  { tag: t.bool, color: '#cb4b16', fontWeight: 'bold' },
  { tag: t.null, color: '#cb4b16', fontWeight: 'bold' },
  { tag: t.function(t.variableName), color: '#268bd2', fontWeight: 'bold' },
  { tag: t.operator, color: '#859900' },
  { tag: t.punctuation, color: '#93a1a1' },
  { tag: t.comment, color: '#586e75', fontStyle: 'italic' },
  { tag: t.variableName, color: '#839496' },
]);

const solarizedDarkTheme = createCmTheme({
  dark: true,
  bg: '#002b36',
  fg: '#839496',
  caret: '#2aa198',
  selection: 'rgba(7, 54, 66, 0.95)',
  selectionMatch: 'rgba(42, 161, 152, 0.25)',
  gutterBg: '#00212b',
  gutterFg: '#586e75',
  gutterBorder: '#073642',
  activeLine: '#07364270',
  activeLineGutter: '#073642',
  tooltipBg: '#00212b',
  tooltipBorder: '#073642',
  tooltipSelected: '#073642',
  tooltipSelectedFg: '#2aa198',
});

export const APP_THEMES: ThemeDefinition[] = [
  {
    id: 'default-dark',
    name: 'Default Dark',
    category: 'dark',
    description: 'TablePlus & DBNerd signature OLED slate with vibrant cyan accents',
    accentColor: '#38bdf8',
    bgCanvas: '#020617',
    bgPanel: '#0f172a',
    bgDarker: '#090d16',
    border: '#1e293b',
    textPrimary: '#f8fafc',
    textMuted: '#94a3b8',
    swatches: ['#020617', '#0f172a', '#38bdf8', '#4ade80'],
    sqlHighlight: defaultDarkHighlight,
    sqlTheme: defaultDarkTheme,
  },
  {
    id: 'default-light',
    name: 'Default Light',
    category: 'light',
    description: '2026 Best of Color: Soft Alabaster with Glacier Blue & Neo-Mint',
    accentColor: '#2563eb',
    bgCanvas: '#f8fafd',
    bgPanel: '#ffffff',
    bgDarker: '#f1f5f9',
    border: '#e2e8f0',
    textPrimary: '#1e293b',
    textMuted: '#64748b',
    swatches: ['#f8fafd', '#ffffff', '#2563eb', '#059669'],
    sqlHighlight: defaultLightHighlight,
    sqlTheme: defaultLightTheme,
  },
  {
    id: 'monokai-pro',
    name: 'Monokai Pro',
    category: 'dark',
    description: 'Iconic warm charcoal with cheerful neon pastel syntax highlighting',
    accentColor: '#ffd866',
    bgCanvas: '#2d2a2e',
    bgPanel: '#221f22',
    bgDarker: '#19181a',
    border: '#403e41',
    textPrimary: '#fcfcfa',
    textMuted: '#939293',
    swatches: ['#2d2a2e', '#ffd866', '#ff6188', '#a9dc76'],
    sqlHighlight: monokaiProHighlight,
    sqlTheme: monokaiProTheme,
  },
  {
    id: 'dracula',
    name: 'Dracula Official',
    category: 'dark',
    description: 'Legendary gothic dark theme with vibrant purples, pinks, and cyans',
    accentColor: '#bd93f9',
    bgCanvas: '#282a36',
    bgPanel: '#21222c',
    bgDarker: '#191a21',
    border: '#44475a',
    textPrimary: '#f8f8f2',
    textMuted: '#6272a4',
    swatches: ['#282a36', '#bd93f9', '#ff79c6', '#50fa7b'],
    sqlHighlight: draculaHighlight,
    sqlTheme: draculaTheme,
  },
  {
    id: 'one-dark',
    name: 'One Dark Pro',
    category: 'dark',
    description: 'Atom & VS Code signature slate blue with balanced syntax contrast',
    accentColor: '#61afef',
    bgCanvas: '#282c34',
    bgPanel: '#21252b',
    bgDarker: '#1e2227',
    border: '#3e4451',
    textPrimary: '#abb2bf',
    textMuted: '#5c6370',
    swatches: ['#282c34', '#61afef', '#c678dd', '#98c379'],
    sqlHighlight: oneDarkHighlight,
    sqlTheme: oneDarkTheme,
  },
  {
    id: 'material-ocean',
    name: 'Material Ocean',
    category: 'dark',
    description: 'Deep oceanic indigo depths with glowing marine teal and cyan',
    accentColor: '#80cbc4',
    bgCanvas: '#0f111a',
    bgPanel: '#090b10',
    bgDarker: '#050608',
    border: '#1a1c25',
    textPrimary: '#eeffff',
    textMuted: '#546e7a',
    swatches: ['#0f111a', '#80cbc4', '#82aaff', '#c792ea'],
    sqlHighlight: materialOceanHighlight,
    sqlTheme: materialOceanTheme,
  },
  {
    id: 'nord',
    name: 'Nord (Arctic)',
    category: 'dark',
    description: 'Arctic icy North-bluish clean palette engineered for zero eye strain',
    accentColor: '#88c0d0',
    bgCanvas: '#2e3440',
    bgPanel: '#242933',
    bgDarker: '#1e222a',
    border: '#3b4252',
    textPrimary: '#eceff4',
    textMuted: '#616e88',
    swatches: ['#2e3440', '#88c0d0', '#81a1c1', '#a3be8c'],
    sqlHighlight: nordHighlight,
    sqlTheme: nordTheme,
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    category: 'dark',
    description: 'Modern cozy community-favorite dark with soothing pastel tones',
    accentColor: '#cba6f7',
    bgCanvas: '#1e1e2e',
    bgPanel: '#181825',
    bgDarker: '#11111b',
    border: '#313244',
    textPrimary: '#cdd6f4',
    textMuted: '#6c7086',
    swatches: ['#1e1e2e', '#cba6f7', '#89b4fa', '#a6e3a1'],
    sqlHighlight: catppuccinMochaHighlight,
    sqlTheme: catppuccinMochaTheme,
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    category: 'dark',
    description: 'Cyberpunk Tokyo dusk aesthetics with electric blues and neon violets',
    accentColor: '#7aa2f7',
    bgCanvas: '#1a1b26',
    bgPanel: '#16161e',
    bgDarker: '#13141c',
    border: '#292e42',
    textPrimary: '#c0caf5',
    textMuted: '#565f89',
    swatches: ['#1a1b26', '#7aa2f7', '#bb9af7', '#9ece6a'],
    sqlHighlight: tokyoNightHighlight,
    sqlTheme: tokyoNightTheme,
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    category: 'dark',
    description: 'Official GitHub developer dark mode with high-contrast code clarity',
    accentColor: '#58a6ff',
    bgCanvas: '#0d1117',
    bgPanel: '#010409',
    bgDarker: '#010409',
    border: '#21262d',
    textPrimary: '#c9d1d9',
    textMuted: '#8b949e',
    swatches: ['#0d1117', '#58a6ff', '#3fb950', '#bc8cff'],
    sqlHighlight: githubDarkHighlight,
    sqlTheme: githubDarkTheme,
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    category: 'dark',
    description: 'Ethan Schoonover’s legendary precision-tuned low-contrast teal palette',
    accentColor: '#2aa198',
    bgCanvas: '#002b36',
    bgPanel: '#00212b',
    bgDarker: '#001b24',
    border: '#073642',
    textPrimary: '#839496',
    textMuted: '#586e75',
    swatches: ['#002b36', '#2aa198', '#268bd2', '#b58900'],
    sqlHighlight: solarizedDarkHighlight,
    sqlTheme: solarizedDarkTheme,
  },
];

export function getThemeDefinition(id?: string): ThemeDefinition {
  if (!id) return APP_THEMES[0];
  const found = APP_THEMES.find((t) => t.id === id);
  if (found) return found;
  if (id === 'light') return APP_THEMES[1];
  if (id === 'dark') return APP_THEMES[0];
  return APP_THEMES[0];
}
