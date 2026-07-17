import { useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

const appWindow = getCurrentWindow();

type Spark = { id: number; emoji: string; tx: number; ty: number };
const SPARK_EMOJIS = ["✨", "⭐", "🌟", "💫"];

// 固定配色
const HAT = "#6C4AB6";
const BRIM = "#553B94";
const NOSE = "#E86FA0";
const EYE = "#3B3846";
const STAR = "M0 -12 L2.94 -4.05 L11.41 -3.71 L4.76 1.55 L7.05 9.71 L0 5 L-7.05 9.71 L-4.76 1.55 L-11.41 -3.71 L-2.94 -4.05 Z";

// 皮肤（毛色 / 肚子 / 耳朵内侧），换肤魔法在这里循环
type Skin = { name: string; fur: string; belly: string; ear: string };
const SKINS: Skin[] = [
  { name: "橘猫", fur: "#F2A65A", belly: "#FCE3C6", ear: "#F4A9C0" },
  { name: "黑猫", fur: "#4A4658", belly: "#6B6579", ear: "#C88BA5" },
  { name: "白猫", fur: "#F1ECE2", belly: "#FFFFFF", ear: "#F4A9C0" },
  { name: "灰猫", fur: "#9AA5B1", belly: "#CBD2D9", ear: "#E7A9BE" },
  { name: "粉猫", fur: "#F3C4D6", belly: "#FFF1F6", ear: "#FF9DC4" },
];

type Pose = "casual" | "battle" | "sleep";
const POSES: { key: Pose; icon: string; label: string }[] = [
  { key: "casual", icon: "😺", label: "休闲" },
  { key: "battle", icon: "⚔️", label: "战斗" },
  { key: "sleep", icon: "😴", label: "睡觉" },
];

type OutfitKind = "wizard" | "bow" | "crown" | "glasses" | "grad" | "none";
const OUTFITS: { key: OutfitKind; icon: string; label: string }[] = [
  { key: "wizard", icon: "🧙", label: "巫师帽" },
  { key: "bow", icon: "🎀", label: "蝴蝶结" },
  { key: "crown", icon: "👑", label: "皇冠" },
  { key: "glasses", icon: "🕶️", label: "墨镜" },
  { key: "grad", icon: "🎓", label: "学士帽" },
  { key: "none", icon: "🚫", label: "不戴" },
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const GOOD_LUCK = ["好运降临中…… 🍀", "今天会顺到起飞 🚀", "锦鲤附体！🐟✨"];

type Spell = { icon: string; label: string; big?: boolean; skin?: boolean; run?: () => string };
const SPELLS: Spell[] = [
  { icon: "🎨", label: "换肤", skin: true },
  { icon: "🔮", label: "专注", run: () => "专注咒语已生效，冲鸭！" },
  { icon: "🍀", label: "好运", run: () => pick(GOOD_LUCK) },
  {
    icon: "⏰",
    label: "报时",
    run: () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `现在 ${hh}:${mm} 喵`;
    },
  },
  { icon: "🎆", label: "烟花", big: true, run: () => "绽放！🎆" },
  { icon: "💤", label: "休息", run: () => "累了就歇会儿吧 💤" },
  { icon: "❤️", label: "卖萌", run: () => "喵呜~ 最喜欢你了 ❤️" },
];

const RADIUS = 112;
function fanAngles(n: number): number[] {
  if (n === 1) return [0];
  const span = 280;
  const start = -140;
  return Array.from({ length: n }, (_, i) => ((start + (span * i) / (n - 1)) * Math.PI) / 180);
}
const offset = (angle: number) => ({ dx: RADIUS * Math.sin(angle), dy: -RADIUS * Math.cos(angle) });

// 魔法棒（点它开法术转盘）
function Wand({ x1, y1, x2, y2, gx, gy }: { x1: number; y1: number; x2: number; y2: number; gx: number; gy: number }) {
  return (
    <g className="wand">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5A3EA0" strokeWidth="6" strokeLinecap="round" />
      <circle className="wand-glow" cx={gx} cy={gy} r="13" fill="#FFE38A" />
      <g transform={`translate(${gx} ${gy})`}>
        <g className="wand-star">
          <path d={STAR} fill="#FFD54A" stroke="#F5A623" strokeWidth="1.5" />
        </g>
      </g>
    </g>
  );
}

// 装扮（画在头部，头心约 100,90）
function Outfit({ kind }: { kind: OutfitKind }) {
  switch (kind) {
    case "wizard":
      return (
        <g className="hat">
          <ellipse cx="100" cy="54" rx="30" ry="5" fill={BRIM} />
          <path d="M80 54 Q100 58 120 54 L110 22 Q106 15 98 20 Z" fill={HAT} />
          <g transform="translate(108 18) scale(0.3)">
            <path d={STAR} fill="#FFE38A" />
          </g>
        </g>
      );
    case "bow":
      return (
        <g>
          <path d="M100 46 L86 38 L86 54 Z" fill="#FF7FB0" />
          <path d="M100 46 L114 38 L114 54 Z" fill="#FF7FB0" />
          <circle cx="100" cy="46" r="4.5" fill="#FF5F9E" />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M78 52 L82 34 L92 45 L100 31 L108 45 L118 34 L122 52 Z" fill="#FFD24A" stroke="#E0A81E" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="78" y="49" width="44" height="5" rx="1.5" fill="#E0A81E" />
          <circle cx="82" cy="37" r="2.4" fill="#FF6FA0" />
          <circle cx="100" cy="34" r="2.6" fill="#5FD1FF" />
          <circle cx="118" cy="37" r="2.4" fill="#7CE0A0" />
        </g>
      );
    case "glasses":
      return (
        <g>
          <ellipse cx="84" cy="89" rx="11" ry="9" fill="#20242e" stroke="#000" strokeWidth="1.5" />
          <ellipse cx="116" cy="89" rx="11" ry="9" fill="#20242e" stroke="#000" strokeWidth="1.5" />
          <path d="M95 87 L105 87" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M73 86 L63 82 M127 86 L137 82" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          <path d="M78 85 Q82 82 88 84 M110 85 Q114 82 120 84" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.5" />
        </g>
      );
    case "grad":
      return (
        <g>
          <path d="M100 48 L84 42 L84 34 L116 34 L116 42 Z" fill="#333" />
          <path d="M68 38 L100 28 L132 38 L100 48 Z" fill="#222" />
          <circle cx="100" cy="38" r="2" fill="#FFD24A" />
          <path d="M100 38 L122 38 L122 56" stroke="#FFD24A" strokeWidth="1.5" fill="none" />
          <circle cx="122" cy="58" r="3.2" fill="#FFD24A" />
        </g>
      );
    default:
      return null;
  }
}

// 衣柜
function Wardrobe() {
  return (
    <svg width="66" height="98" viewBox="0 0 66 98">
      <rect x="5" y="4" width="56" height="86" rx="6" fill="#B5794B" stroke="#8A5A34" strokeWidth="2" />
      <line x1="33" y1="8" x2="33" y2="86" stroke="#8A5A34" strokeWidth="2" />
      <rect x="11" y="12" width="18" height="70" rx="3" fill="#C98F5F" />
      <rect x="37" y="12" width="18" height="70" rx="3" fill="#C98F5F" />
      <circle cx="29" cy="48" r="2.6" fill="#5A3A20" />
      <circle cx="37" cy="48" r="2.6" fill="#5A3A20" />
      <rect x="9" y="90" width="8" height="7" rx="1" fill="#8A5A34" />
      <rect x="49" y="90" width="8" height="7" rx="1" fill="#8A5A34" />
      <g transform="translate(33 3) scale(0.22)">
        <path d={STAR} fill="#FFE38A" />
      </g>
    </svg>
  );
}

type Wheel = "spell" | "pose" | "outfit" | null;

function App() {
  const [pose, setPose] = useState<Pose>("casual");
  const [outfit, setOutfit] = useState<OutfitKind>("wizard");
  const [skin, setSkin] = useState(0);
  const sk = SKINS[skin];
  const [casting, setCasting] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [bubble, setBubble] = useState<string | null>(null);
  const [wheel, setWheel] = useState<Wheel>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const start = useRef<{ x: number; y: number } | null>(null);
  const downTarget = useRef<EventTarget | null>(null);
  const moved = useRef(false);
  const sparkId = useRef(0);
  const castTimer = useRef<number | null>(null);
  const bubbleTimer = useRef<number | null>(null);

  function doSparkles(big = false) {
    const n = big ? 16 : 8;
    const burst: Spark[] = Array.from({ length: n }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = (big ? 45 : 30) + Math.random() * (big ? 60 : 40);
      return { id: sparkId.current++, emoji: pick(SPARK_EMOJIS), tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist };
    });
    setSparks((s) => [...s, ...burst]);
    const ids = new Set(burst.map((b) => b.id));
    setTimeout(() => setSparks((s) => s.filter((x) => !ids.has(x.id))), 900);
  }

  function poseOnce(ms = 500) {
    setCasting(true);
    if (castTimer.current) clearTimeout(castTimer.current);
    castTimer.current = window.setTimeout(() => setCasting(false), ms);
  }

  function showBubble(text: string) {
    setBubble(text);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), 2500);
  }

  function castSpell(spell: Spell) {
    setWheel(null);
    doSparkles(spell.big);
    poseOnce(600);
    if (spell.skin) {
      const next = (skin + 1) % SKINS.length;
      setSkin(next);
      showBubble(`换上「${SKINS[next].name}」皮肤！🎨`);
    } else if (spell.run) {
      showBubble(spell.run());
    }
  }

  function selectPose(p: Pose) {
    setWheel(null);
    setPose(p);
    doSparkles(false);
    poseOnce(400);
  }

  function selectOutfit(k: OutfitKind) {
    setWheel(null);
    setOutfit(k);
    doSparkles(false);
    poseOnce(400);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    setMenuOpen(false);
    start.current = { x: e.clientX, y: e.clientY };
    downTarget.current = e.target;
    moved.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (Math.hypot(dx, dy) > 4) {
      moved.current = true;
      start.current = null;
      appWindow.startDragging();
    }
  }

  function onPointerUp() {
    if (start.current && !moved.current) {
      const el = downTarget.current as Element | null;
      if (el && el.closest(".wand")) setWheel((w) => (w === "spell" ? null : "spell"));
      else setWheel((w) => (w === "pose" ? null : "pose"));
    }
    start.current = null;
    downTarget.current = null;
  }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setMenuOpen(true);
  }

  return (
    <div className="stage" onContextMenu={onContextMenu}>
      {bubble && <div className="bubble">{bubble}</div>}

      {/* 衣柜（点它换装） */}
      <button
        className="wardrobe"
        title="点我换装"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setWheel((w) => (w === "outfit" ? null : "outfit"))}
      >
        <Wardrobe />
      </button>

      <div
        className={`cat ${casting ? "casting" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg viewBox="0 0 200 200" width="200" height="200">
          {/* ============ 休闲 ============ */}
          {pose === "casual" && (
            <>
              <g className="tail">
                <path d="M148 158 Q188 150 180 112 Q176 92 162 100" fill="none" stroke={sk.fur} strokeWidth="14" strokeLinecap="round" />
              </g>
              <ellipse cx="100" cy="152" rx="45" ry="40" fill={sk.fur} />
              <ellipse cx="100" cy="160" rx="23" ry="24" fill={sk.belly} />
              <ellipse cx="138" cy="152" rx="10" ry="8" fill={sk.fur} />
              <Wand x1={138} y1={152} x2={172} y2={74} gx={174} gy={68} />
              <g className="head">
                <path d="M62 60 L54 26 L92 50 Z" fill={sk.fur} />
                <path d="M138 60 L146 26 L108 50 Z" fill={sk.fur} />
                <path d="M67 54 L62 37 L84 50 Z" fill={sk.ear} />
                <path d="M133 54 L138 37 L116 50 Z" fill={sk.ear} />
                <circle cx="100" cy="90" r="45" fill={sk.fur} />
                <ellipse cx="72" cy="98" rx="7" ry="4" fill={sk.ear} opacity="0.5" />
                <ellipse cx="128" cy="98" rx="7" ry="4" fill={sk.ear} opacity="0.5" />
                <g className="eyes">
                  <ellipse cx="84" cy="88" rx="5.5" ry="7.5" fill={EYE} />
                  <ellipse cx="116" cy="88" rx="5.5" ry="7.5" fill={EYE} />
                  <circle cx="86" cy="85" r="2" fill="#fff" />
                  <circle cx="118" cy="85" r="2" fill="#fff" />
                </g>
                <path d="M97 98 L103 98 L100 102 Z" fill={NOSE} />
                <path d="M100 102 Q96 106 92 103 M100 102 Q104 106 108 103" fill="none" stroke="#7a5568" strokeWidth="1.6" strokeLinecap="round" />
                <g stroke="#B9A98C" strokeWidth="1.8" strokeLinecap="round" opacity="0.8">
                  <path d="M72 96 L50 92 M72 101 L50 102" />
                  <path d="M128 96 L150 92 M128 101 L150 102" />
                </g>
                <Outfit kind={outfit} />
              </g>
            </>
          )}

          {/* ============ 战斗 ============ */}
          {pose === "battle" && (
            <>
              <ellipse className="aura" cx="100" cy="130" rx="82" ry="66" fill="#FFC24A" />
              <g className="tail">
                <path d="M148 150 Q182 128 178 92 Q177 80 168 88" fill="none" stroke={sk.fur} strokeWidth="14" strokeLinecap="round" />
              </g>
              <ellipse cx="100" cy="152" rx="45" ry="40" fill={sk.fur} />
              <ellipse cx="100" cy="160" rx="23" ry="24" fill={sk.belly} />
              <ellipse cx="128" cy="128" rx="10" ry="8" fill={sk.fur} />
              <Wand x1={128} y1={128} x2={158} y2={40} gx={160} gy={34} />
              <circle cx="160" cy="34" r="20" fill="none" stroke="#FFE38A" strokeWidth="2" opacity="0.7" />
              <g className="head">
                <path d="M62 60 L52 22 L92 48 Z" fill={sk.fur} />
                <path d="M138 60 L148 22 L108 48 Z" fill={sk.fur} />
                <path d="M67 53 L60 33 L84 48 Z" fill={sk.ear} />
                <path d="M133 53 L140 33 L116 48 Z" fill={sk.ear} />
                <circle cx="100" cy="90" r="45" fill={sk.fur} />
                <g stroke="#4a3b2b" strokeWidth="3" strokeLinecap="round">
                  <path d="M72 82 L92 90" />
                  <path d="M128 82 L108 90" />
                </g>
                <g className="eyes">
                  <ellipse cx="85" cy="94" rx="5.5" ry="4" fill={EYE} />
                  <ellipse cx="115" cy="94" rx="5.5" ry="4" fill={EYE} />
                </g>
                <path d="M92 104 Q100 114 108 104 Q100 108 92 104 Z" fill="#8a3a52" />
                <path d="M95 105 L97 109 L99 105 Z" fill="#fff" />
                <path d="M101 105 L103 109 L105 105 Z" fill="#fff" />
                <g stroke="#B9A98C" strokeWidth="1.8" strokeLinecap="round" opacity="0.8">
                  <path d="M72 98 L50 94 M72 103 L50 104" />
                  <path d="M128 98 L150 94 M128 103 L150 104" />
                </g>
                <Outfit kind={outfit} />
              </g>
            </>
          )}

          {/* ============ 睡觉 ============ */}
          {pose === "sleep" && (
            <>
              <rect x="22" y="158" width="156" height="32" rx="12" fill="#5C7FB0" />
              <rect x="22" y="158" width="156" height="9" rx="4" fill="#8AAAD6" />
              <ellipse cx="150" cy="162" rx="30" ry="15" fill="#FFFFFF" />
              <ellipse cx="92" cy="162" rx="56" ry="20" fill={sk.fur} />
              <path d="M38 162 Q80 152 122 162 L122 186 Q80 192 38 186 Z" fill="#7FA8D0" />
              <path d="M38 162 Q80 152 122 162 L122 169 Q80 159 38 169 Z" fill="#A9C6E6" />
              <ellipse cx="52" cy="176" rx="8" ry="5" fill={sk.fur} />
              <g>
                <path d="M136 132 L131 116 L150 130 Z" fill={sk.fur} />
                <path d="M166 132 L171 116 L152 130 Z" fill={sk.fur} />
                <circle cx="151" cy="146" r="26" fill={sk.fur} />
                <ellipse cx="140" cy="152" rx="5" ry="3" fill={sk.ear} opacity="0.5" />
                <ellipse cx="162" cy="152" rx="5" ry="3" fill={sk.ear} opacity="0.5" />
                <path d="M139 145 Q143 150 147 145" fill="none" stroke={EYE} strokeWidth="2" strokeLinecap="round" />
                <path d="M154 145 Q158 150 162 145" fill="none" stroke={EYE} strokeWidth="2" strokeLinecap="round" />
                <path d="M149 152 L153 152 L151 155 Z" fill={NOSE} />
              </g>
            </>
          )}
        </svg>

        {pose === "sleep" && (
          <div className="zzz-wrap">
            <span>z</span>
            <span>z</span>
            <span>Z</span>
          </div>
        )}

        <div className="spark-origin">
          {sparks.map((s) => (
            <span key={s.id} className="spark" style={{ "--tx": `${s.tx}px`, "--ty": `${s.ty}px` } as React.CSSProperties}>
              {s.emoji}
            </span>
          ))}
        </div>
      </div>

      {wheel && (
        <>
          <div className="wheel-backdrop" onPointerDown={() => setWheel(null)} onContextMenu={onContextMenu} />
          <div className="wheel-center">
            {wheel === "spell" &&
              SPELLS.map((sp, i) => {
                const { dx, dy } = offset(fanAngles(SPELLS.length)[i]);
                return (
                  <button key={sp.label} className="wheel-item" style={{ transform: `translate(${dx}px, ${dy}px)`, animationDelay: `${i * 40}ms` }} onClick={() => castSpell(sp)}>
                    <span className="wi-icon">{sp.icon}</span>
                    <span className="wi-label">{sp.label}</span>
                  </button>
                );
              })}
            {wheel === "pose" &&
              POSES.map((p, i) => {
                const { dx, dy } = offset(fanAngles(POSES.length)[i]);
                return (
                  <button key={p.key} className={`wheel-item ${p.key === pose ? "active" : ""}`} style={{ transform: `translate(${dx}px, ${dy}px)`, animationDelay: `${i * 40}ms` }} onClick={() => selectPose(p.key)}>
                    <span className="wi-icon">{p.icon}</span>
                    <span className="wi-label">{p.label}</span>
                  </button>
                );
              })}
            {wheel === "outfit" &&
              OUTFITS.map((o, i) => {
                const { dx, dy } = offset(fanAngles(OUTFITS.length)[i]);
                return (
                  <button key={o.key} className={`wheel-item ${o.key === outfit ? "active" : ""}`} style={{ transform: `translate(${dx}px, ${dy}px)`, animationDelay: `${i * 40}ms` }} onClick={() => selectOutfit(o.key)}>
                    <span className="wi-icon">{o.icon}</span>
                    <span className="wi-label">{o.label}</span>
                  </button>
                );
              })}
          </div>
        </>
      )}

      {menuOpen && (
        <div className="menu" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => invoke("quit")}>退出</button>
        </div>
      )}
    </div>
  );
}

export default App;
