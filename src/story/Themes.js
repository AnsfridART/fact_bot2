// v16: «атмосферы» — у канала одна рамка (герой «ТЫ», шкала шанса, субтитры, выбор A/B/C),
// а палитра, свет, погода и грейдинг подбираются под каждое дело.
// ui  — цвета интерфейса (шкала, карточки, субтитры), подменяют N в Noir.jsx
// bg  — цвета фонов (стены, пол, мебель, свет из окна, неон)
// grade — общий цветовой «фильтр» кадра; fear/hope — тон, к которому кадр уходит, когда шанс падает/растёт
export const THEMES = {
  // кибер, крипта, хакеры — фирменная гамма канала
  noir: {
    ui: { bg: "#06090d", panel: "#0d131a", panel2: "#141d27", line: "#1f2d3a", acc: "#3dffa8", yellow: "#ffb020", red: "#ff3b4f", cyan: "#4fd8ff", text: "#eef6f2", dim: "#7f9590", good: "#3dffa8", warn: "#ffb020", light: false },
    bg: { sky: "#05080c", wall: "#0b1216", wall2: "#0f181d", floor: "#05080b", furn: "#16202a", furn2: "#1d2a35", wood: "#2a2018", light: "#ffb020", neon: "#3dffa8", neon2: "#ffb020", screen: "#3dffa8", window: "#ffcf7a" },
    grade: { filter: "saturate(1.05) contrast(1.05)", overlay: "linear-gradient(180deg, rgba(0,30,40,.35), rgba(0,8,12,.08) 40%, rgba(0,6,10,.6))" },
    fear: "#ff2a3a", hope: "#ffb347", rim: "#3dffa8", weather: null, music: "tense",
  },
  // полиция, розыск, допросы, побеги — холодный синий и мигалки
  police: {
    ui: { bg: "#050913", panel: "#0b1222", panel2: "#121b30", line: "#1d2a45", acc: "#5aa9ff", yellow: "#ffd23f", red: "#ff3346", cyan: "#9ad0ff", text: "#eef3ff", dim: "#7d8aa6", good: "#5aa9ff", warn: "#ffd23f", light: false },
    bg: { sky: "#040814", wall: "#0c1426", wall2: "#111b31", floor: "#060a14", furn: "#18233a", furn2: "#22304d", wood: "#2a2a30", light: "#bcd6ff", neon: "#5aa9ff", neon2: "#ff3346", screen: "#9ad0ff", window: "#cfe0ff" },
    grade: { filter: "saturate(.9) contrast(1.1)", overlay: "linear-gradient(180deg, rgba(10,25,70,.4), rgba(0,0,0,.05) 45%, rgba(0,4,16,.65))" },
    fear: "#ff2233", hope: "#9fd0ff", rim: "#5aa9ff", weather: "rain", siren: true, music: "tense",
  },
  // аферы, суды, деньги, документы — светлая «бумага» и красные чернила
  dossier: {
    ui: { bg: "#ece5d6", panel: "#f6f1e6", panel2: "#e2d9c6", line: "#cfc4ad", acc: "#c8102e", yellow: "#1f6b4c", red: "#c8102e", cyan: "#2b4c7e", text: "#1d1a17", dim: "#6e655a", good: "#1f6b4c", warn: "#b7791f", light: true },
    bg: { sky: "#d9cfbb", wall: "#e3d9c5", wall2: "#d6cab2", floor: "#b9aa8e", furn: "#7a5c3e", furn2: "#8f6d4b", wood: "#6b4a2e", light: "#fff3d6", neon: "#c8102e", neon2: "#1f6b4c", screen: "#dfe8e2", window: "#fff8e6" },
    grade: { filter: "sepia(.25) saturate(.9) brightness(1.05)", overlay: "radial-gradient(ellipse at 50% 45%, rgba(255,250,235,0) 50%, rgba(60,40,20,.45) 100%)" },
    fear: "#a0101e", hope: "#2f8f5b", rim: "#c8102e", weather: null, paper: true, music: "mystery",
  },
  // выживание, катастрофы — ночная бирюза, дождь, оранжевый акцент
  storm: {
    ui: { bg: "#03111a", panel: "#082029", panel2: "#0c2b36", line: "#14404d", acc: "#ff8a1f", yellow: "#ffd23f", red: "#ff3b3b", cyan: "#5fe0ff", text: "#eaf7fb", dim: "#6f9aa6", good: "#5fe0ff", warn: "#ffd23f", light: false },
    bg: { sky: "#021018", wall: "#0a1e26", wall2: "#0d2630", floor: "#031016", furn: "#133240", furn2: "#1a4050", wood: "#2a2620", light: "#ff8a1f", neon: "#ff8a1f", neon2: "#5fe0ff", screen: "#5fe0ff", window: "#ffb46a" },
    grade: { filter: "saturate(1.1) contrast(1.08)", overlay: "linear-gradient(180deg, rgba(0,40,60,.4), rgba(0,0,0,.05) 45%, rgba(0,10,16,.65))" },
    fear: "#ff3b3b", hope: "#ffb46a", rim: "#ff8a1f", weather: "rain", music: "epic",
  },
  // ограбления, казино, роскошь — чёрное золото
  casino: {
    ui: { bg: "#0a0805", panel: "#15110a", panel2: "#1f1910", line: "#3a2f1a", acc: "#e8b84a", yellow: "#e8b84a", red: "#d7263d", cyan: "#f3dfa2", text: "#fbf3df", dim: "#9a8a66", good: "#e8b84a", warn: "#ff9a3c", light: false },
    bg: { sky: "#080604", wall: "#1a120a", wall2: "#22180d", floor: "#0b0805", furn: "#3a1418", furn2: "#4a1c20", wood: "#3a2814", light: "#ffd27a", neon: "#e8b84a", neon2: "#d7263d", screen: "#f3dfa2", window: "#ffd27a" },
    grade: { filter: "saturate(1.05) contrast(1.1)", overlay: "linear-gradient(180deg, rgba(40,25,0,.35), rgba(0,0,0,.05) 45%, rgba(10,6,0,.65))" },
    fear: "#d7263d", hope: "#ffe08a", rim: "#e8b84a", weather: null, music: "tense",
  },
  // жуткие, мистические, «тихие» дела — почти без цвета и один красный
  silence: {
    ui: { bg: "#0b0b0c", panel: "#141416", panel2: "#1c1c1f", line: "#2a2a2e", acc: "#e01e2e", yellow: "#d9d9d9", red: "#e01e2e", cyan: "#bfbfbf", text: "#f2f2f2", dim: "#8a8a8f", good: "#d9d9d9", warn: "#a0a0a0", light: false },
    bg: { sky: "#08080a", wall: "#141416", wall2: "#19191c", floor: "#070708", furn: "#222226", furn2: "#2a2a2f", wood: "#262220", light: "#e8e8e8", neon: "#e01e2e", neon2: "#bdbdbd", screen: "#d0d0d0", window: "#e6e6e6" },
    grade: { filter: "grayscale(.75) contrast(1.15)", overlay: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,.75) 100%)" },
    fear: "#e01e2e", hope: "#d8d8d8", rim: "#e01e2e", weather: null, music: "mystery",
  },
  // v19: бэкрумс — болезненно-жёлтый свет, гул ламп, мокрый ковёр
  backrooms: {
    ui: { bg: "#0d0b04", panel: "#17140a", panel2: "#211d0e", line: "#3a3318", acc: "#ffe14a", yellow: "#ffe14a", red: "#ff3b3b", cyan: "#f2e8b0", text: "#fbf6dc", dim: "#a99d6a", good: "#ffe14a", warn: "#ff9a3c", light: false },
    bg: { sky: "#2a2410", wall: "#c9b458", wall2: "#b39f45", floor: "#8a7a44", furn: "#a8954a", furn2: "#b9a552", wood: "#6b5a2a", light: "#fff8d2", neon: "#ffe14a", neon2: "#ff3b3b", screen: "#fff3b0", window: "#fff8d2" },
    grade: { filter: "saturate(1.05) contrast(1.06)", overlay: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 45%, rgba(20,14,0,.7) 100%)" },
    fear: "#ff3b3b", hope: "#fff3b0", rim: "#ffe14a", weather: null, music: "mystery",
  },
};

// атмосфера по умолчанию по теме истории (если в сценарии не указано "theme")
export function pickTheme(name) {
  return THEMES[name] ? name : "noir";
}

export const mix = (a, b, k) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
};
