/**
 * ChibiAvatar — Q版天宫神将与九幽小妖矢量立绘组件
 *
 * Replaces plain text coins with vivid Q-version (Chibi) characters:
 *   - 兵: Q版金甲天兵 / 托塔李天王 (金盔红缨 + 玲珑宝塔)
 *   - 車: Q版雷震子 / 雷部战神 (风雷双翼 + 紫金雷锤)
 *   - 馬: Q版二郎显圣真君 (额间天眼 + 银甲神锋)
 *   - 炮: Q版哪吒三太子 (双丸子头 + 混天绫 + 三昧火炮)
 *   - 相: Q版齐天大圣孙悟空 (凤翅紫金冠 + 如意金箍棒)
 *   - 妖魔: Q版牛魔王 Boss、玄冥甲龟、血煞狼骑、九幽小妖
 */

import React from 'react';

export function DeityChibi({ type, star = 1, size = 42, hasMountBuff = false }) {
  const isMax = star >= 3;
  const isMid = star === 2;

  return (
    <div
      className={`chibi-deity chibi-${type} star-${star} ${hasMountBuff ? 'mounted-pao' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        {/* 2★ / 3★ Radiant Halo behind character */}
        {star >= 2 && (
          <circle
            cx="32"
            cy="32"
            r={isMax ? '29' : '26'}
            fill="none"
            stroke={isMax ? '#F0CF86' : '#6FA8FF'}
            strokeWidth={isMax ? '2.5' : '1.6'}
            strokeDasharray={isMax ? '5 2' : '3 3'}
            opacity="0.85"
          />
        )}

        {/* Base Pedestal (Jade/Gold Lotus Seat) */}
        <ellipse
          cx="32"
          cy="56"
          rx="22"
          ry="5.5"
          fill={isMax ? '#CF3B2E' : '#2C223E'}
          stroke="#F0CF86"
          strokeWidth="1.8"
        />

        {/* ── 車: Q版雷震子 (Thunder Wings + Golden Hammer) ── */}
        {type === 'che' && (
          <g>
            {/* Thunder Wings */}
            <path
              d="M6 28 L18 22 L15 38 L8 36 Z M58 28 L46 22 L49 38 L56 36 Z"
              fill={isMax ? '#F0CF86' : '#4C8DFF'}
              stroke="#FFF5D6"
              strokeWidth="1.2"
            />
            {/* Body Armor */}
            <path d="M21 38 Q32 34 43 38 L46 53 L18 53 Z" fill="#1D4ED8" stroke="#93C5FD" strokeWidth="1.5" />
            {/* Chibi Head */}
            <circle cx="32" cy="25" r="12.5" fill="#FFE4C4" stroke="#3B2314" strokeWidth="1.4" />
            {/* Spiky Thunder Hair & Crown */}
            <path
              d="M18 22 Q20 9 32 10 Q44 9 46 22 Q39 16 32 17 Q25 16 18 22 Z"
              fill="#38BDF8"
              stroke="#0284C7"
              strokeWidth="1.2"
            />
            {/* Lightning Emblem on Forehead */}
            <polygon points="32,11 29,18 33,18 30,23 36,16 32,16" fill="#FACC15" />
            {/* Cute Determined Eyes */}
            <ellipse cx="27.5" cy="26" rx="2.1" ry="2.5" fill="#1E293B" />
            <ellipse cx="36.5" cy="26" rx="2.1" ry="2.5" fill="#1E293B" />
            <circle cx="28.2" cy="25" r="0.8" fill="#FFF" />
            <circle cx="37.2" cy="25" r="0.8" fill="#FFF" />
            {/* Thunder Hammer in Hand */}
            <rect x="45" y="28" width="11" height="8" rx="2" fill="#FACC15" stroke="#92400E" strokeWidth="1.2" />
            <line x1="50.5" y1="36" x2="50.5" y2="49" stroke="#92400E" strokeWidth="2.5" />
          </g>
        )}

        {/* ── 炮: Q版哪吒 (Double Buns + Red Ribbon + Fire Cannon) ── */}
        {type === 'pao' && (
          <g>
            {/* Floating Red Sash (混天绫) */}
            <path
              d="M10 34 Q6 20 18 18 M54 34 Q58 20 46 18"
              fill="none"
              stroke="#EF4444"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Lotus Red Tunic */}
            <path d="M21 38 Q32 34 43 38 L45 53 L19 53 Z" fill="#DC2626" stroke="#FDE047" strokeWidth="1.5" />
            {/* Double Hair Buns (双丸子头) */}
            <circle cx="19" cy="15" r="5.5" fill="#1F2937" stroke="#EF4444" strokeWidth="1.5" />
            <circle cx="45" cy="15" r="5.5" fill="#1F2937" stroke="#EF4444" strokeWidth="1.5" />
            {/* Chibi Head */}
            <circle cx="32" cy="25" r="12" fill="#FFE4C4" stroke="#3B2314" strokeWidth="1.4" />
            {/* Bangs */}
            <path d="M20 22 Q26 12 32 14 Q38 12 44 22 Q32 18 20 22 Z" fill="#1F2937" />
            {/* Red Forehead Mark */}
            <circle cx="32" cy="20" r="1.8" fill="#EF4444" />
            {/* Playful Eyes & Grin */}
            <circle cx="27.5" cy="25.5" r="2.1" fill="#1F2937" />
            <circle cx="36.5" cy="25.5" r="2.1" fill="#1F2937" />
            <path d="M29 30 Q32 32.5 35 30" fill="none" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" />
            {/* Mini Golden-Crimson Fire Cannon in Front */}
            <rect x="24" y="39" width="16" height="11" rx="4" fill="#7C2D12" stroke="#FACC15" strokeWidth="1.8" />
            <circle cx="32" cy="44.5" r="3.5" fill="#F97316" />
          </g>
        )}

        {/* ── 馬: Q版二郎显圣真君 (Third Eye + Silver Armor + Halberd) ── */}
        {type === 'ma' && (
          <g>
            {/* Silver-Gold Cape & Armor */}
            <path d="M20 38 Q32 34 44 38 L46 53 L18 53 Z" fill="#334155" stroke="#FDE047" strokeWidth="1.6" />
            {/* Chibi Head */}
            <circle cx="32" cy="25" r="12" fill="#FFE4C4" stroke="#3B2314" strokeWidth="1.4" />
            {/* Topknot General Crown */}
            <rect x="27" y="7" width="10" height="6" rx="2" fill="#FACC15" stroke="#92400E" strokeWidth="1.2" />
            <path d="M19 21 Q25 12 32 13 Q39 12 45 21 Z" fill="#0F172A" />
            {/* Glowing Golden Third Eye (天眼) */}
            <polygon points="32,16 34,20 32,23 30,20" fill="#FACC15" stroke="#B45309" strokeWidth="0.8" />
            {/* Sharp Heroic Eyes */}
            <ellipse cx="27" cy="26" rx="2" ry="2.2" fill="#0F172A" />
            <ellipse cx="37" cy="26" rx="2" ry="2.2" fill="#0F172A" />
            {/* Three-Pointed Halberd (三尖两刃刀) */}
            <line x1="50" y1="14" x2="48" y2="52" stroke="#D97706" strokeWidth="2.4" />
            <polygon points="50,8 45,18 50,15 55,18" fill="#E2E8F0" stroke="#FACC15" strokeWidth="1" />
          </g>
        )}

        {/* ── 兵: Q版托塔天兵 / 李天王 (Golden Helmet + Mini Pagoda) ── */}
        {type === 'bing' && (
          <g>
            {/* Emerald-Gold Armor */}
            <path d="M20 38 Q32 34 44 38 L46 53 L18 53 Z" fill="#065F46" stroke="#FCD34D" strokeWidth="1.6" />
            {/* Red Plume on Helmet */}
            <path d="M32 5 Q38 8 35 14 Q29 14 32 5 Z" fill="#EF4444" />
            {/* Chibi Head */}
            <circle cx="32" cy="26" r="12" fill="#FFE4C4" stroke="#3B2314" strokeWidth="1.4" />
            {/* Golden Celestial Helmet */}
            <path d="M18 23 Q20 12 32 12 Q44 12 46 23 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="1.4" />
            {/* Eyes */}
            <circle cx="27.5" cy="26.5" r="2" fill="#1F2937" />
            <circle cx="36.5" cy="26.5" r="2" fill="#1F2937" />
            {/* Glowing Golden Pagoda in Palm (玲珑宝塔) */}
            <polygon points="14,24 8,32 20,32" fill="#FACC15" stroke="#92400E" strokeWidth="1" />
            <polygon points="14,29 7,38 21,38" fill="#F59E0B" stroke="#92400E" strokeWidth="1" />
          </g>
        )}

        {/* ── 相: Q版齐天大圣 (Phoenix Feather Crown + Golden Staff) ── */}
        {type === 'xiang' && (
          <g>
            {/* Two Long Phoenix Feathers (雉翎) */}
            <path
              d="M27 12 Q14 4 8 14 M37 12 Q50 4 56 14"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Royal Purple-Gold Armor */}
            <path d="M20 38 Q32 34 44 38 L46 53 L18 53 Z" fill="#6B21A8" stroke="#FACC15" strokeWidth="1.6" />
            {/* Chibi Monkey King Head */}
            <circle cx="32" cy="25" r="12" fill="#FDBA74" stroke="#7C2D12" strokeWidth="1.4" />
            <ellipse cx="32" cy="26.5" rx="9.5" ry="7.5" fill="#FFEDD5" />
            {/* Golden Fillet Headband (紧箍) */}
            <path d="M20 20 Q32 23 44 20" fill="none" stroke="#FACC15" strokeWidth="3" />
            {/* Fiery Golden Eyes (火眼金睛) */}
            <circle cx="27.5" cy="25.5" r="2.2" fill="#DC2626" />
            <circle cx="36.5" cy="25.5" r="2.2" fill="#DC2626" />
            <circle cx="27.5" cy="25.5" r="0.9" fill="#FEF08A" />
            <circle cx="36.5" cy="25.5" r="0.9" fill="#FEF08A" />
            {/* Ruyi Jingu Bang (如意金箍棒) */}
            <line x1="12" y1="46" x2="52" y2="42" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
            <line x1="12" y1="46" x2="17" y2="45.5" stroke="#FACC15" strokeWidth="4.5" />
            <line x1="47" y1="42.5" x2="52" y2="42" stroke="#FACC15" strokeWidth="4.5" />
          </g>
        )}
      </svg>

      {/* Chess Role Corner Pill (Clear high-contrast badge) */}
      <span className={`chibi-role-pill role-${type}`}>
        {type === 'che' ? '車' : type === 'pao' ? '炮' : type === 'ma' ? '馬' : type === 'bing' ? '兵' : '相'}
      </span>

      {/* Star Rating Strip */}
      <span className={`chibi-star-strip star-${star}`}>
        {isMax ? '★★★化神' : isMid ? '★★' : '★'}
      </span>

      {/* Cannon Screen-Mount Bonus Indicator */}
      {hasMountBuff && (
        <span className="chibi-mount-tag" title="前方有友军充当炮架，触发隔山打牛重炮增伤!">
          🔥架炮×1.8
        </span>
      )}
    </div>
  );
}

/**
 * Q-version Abyssal Demon & Boss Avatar
 */
export function DemonChibi({ glyph, isBoss = false }) {
  return (
    <div className={`chibi-demon ${isBoss ? 'boss' : ''}`}>
      <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
        {isBoss ? (
          <g>
            {/* Giant Golden Bull Horns for Boss */}
            <path d="M6 18 Q4 6 16 12 M42 18 Q44 6 32 12" fill="none" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" />
            <circle cx="24" cy="26" r="15" fill="#7F1D1D" stroke="#FACC15" strokeWidth="2" />
            {/* Fierce Glowing Eyes */}
            <polygon points="16,22 22,25 16,26" fill="#FEF08A" />
            <polygon points="32,22 26,25 32,26" fill="#FEF08A" />
            {/* Golden Nose Ring */}
            <circle cx="24" cy="33" r="4" fill="none" stroke="#FACC15" strokeWidth="2" />
          </g>
        ) : (
          <g>
            {/* Cute Little Demon Horns */}
            <polygon points="12,15 15,7 19,14" fill="#F87171" />
            <polygon points="36,15 33,7 29,14" fill="#F87171" />
            <circle
              cx="24"
              cy="26"
              r="13"
              fill={glyph === '甲' ? '#1E3A8A' : glyph === '骑' ? '#581C87' : '#31102F'}
              stroke="#FB7185"
              strokeWidth="1.8"
            />
            {/* Glowing Demon Eyes */}
            <circle cx="19.5" cy="25" r="2.2" fill="#FDE047" />
            <circle cx="28.5" cy="25" r="2.2" fill="#FDE047" />
            {/* Little Fang Smile */}
            <path d="M19 31 Q24 34 29 31" fill="none" stroke="#FDA4AF" strokeWidth="1.5" />
          </g>
        )}
      </svg>
      <span className="chibi-demon-label">{glyph}</span>
    </div>
  );
}

/**
 * Q-version Taibai Jinxing (太白金星) Tutorial Mentor Avatar
 */
export function MentorChibi({ size = 48 }) {
  return (
    <div className="chibi-mentor" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <circle cx="32" cy="32" r="29" fill="#2A1F3D" stroke="#F0CF86" strokeWidth="2.2" />
        {/* White Immortal Robe */}
        <path d="M16 44 Q32 38 48 44 L51 58 L13 58 Z" fill="#F8FAFC" stroke="#F0CF86" strokeWidth="1.5" />
        {/* Head */}
        <circle cx="32" cy="27" r="12.5" fill="#FFE4C4" stroke="#78350F" strokeWidth="1.2" />
        {/* White Hair & Golden Lotus Crown */}
        <path d="M19 23 Q22 11 32 11 Q42 11 45 23 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
        <polygon points="32,5 27,13 37,13" fill="#FACC15" stroke="#92400E" strokeWidth="1" />
        {/* Long White Eyebrows */}
        <path d="M22 22 Q27 19 30 22 M34 22 Q37 19 42 22" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        {/* Kind Smiling Eyes */}
        <path d="M25 26 Q27.5 24 30 26 M34 26 Q36.5 24 39 26" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
        {/* Fluffy White Beard */}
        <path d="M23 32 Q32 52 41 32 Q32 36 23 32 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

