/**
 * ChibiAvatar — 拟真Q版古代军械与守城器械组件
 *
 * Renders tangible, physical war machines & battlefield objects so every chess unit's
 * real-world function is immediately obvious at a glance:
 *   - 炮 (pao): 红衣重炮车 (木轮炮架 + 青铜/朱红炮管 + 铁炮弹堆 + 燃烧引信；架炮时仰角抬升！)
 *   - 車 (che): 重装床弩战车 (四轮装甲车体 + 前排破阵撞角 + 三弓床子重弩 + 上膛破甲巨箭)
 *   - 兵 (bing): 铁盾拒马枪阵 (铆钉重型步人盾 + 鹿角拒马木刺 + 寒铁长枪)
 *   - 馬 (ma):  玄甲斩马铁骑 (披甲战马 + 红缨马面 + 青龙偃月斩马长刀)
 *   - 相 (xiang): 诸葛连弩箭楼 (城防木石箭塔 + 诸葛连发弩匣 + 助威牛皮战鼓)
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
        {/* 2★ / 3★ Veteran Brass Ring */}
        {star >= 2 && (
          <circle
            cx="32"
            cy="32"
            r={isMax ? '29' : '26.5'}
            fill="none"
            stroke={isMax ? '#FACC15' : '#93C5FD'}
            strokeWidth={isMax ? '2.4' : '1.5'}
            strokeDasharray={isMax ? '6 2' : '4 3'}
            opacity="0.85"
          />
        )}

        {/* Stone / Timber Emplacement Base */}
        <ellipse
          cx="32"
          cy="55"
          rx="23"
          ry="6"
          fill={isMax ? '#5C1D18' : '#2B241E'}
          stroke={isMax ? '#FACC15' : '#A88B5A'}
          strokeWidth="1.8"
        />

        {/* ── 炮: 实体红衣火炮车 + 炮轮 + 铁炮弹堆 + 引信火花 ── */}
        {type === 'pao' && (
          <g>
            {/* Wooden Artillery Carriage Side Cheek */}
            <path d="M16 48 L24 35 L42 35 L48 48 Z" fill="#78350F" stroke="#D97706" strokeWidth="1.4" />
            {/* Stacked Black Iron Cannonballs beside carriage */}
            <circle cx="15" cy="51" r="3.6" fill="#1E293B" stroke="#64748B" strokeWidth="1" />
            <circle cx="21.5" cy="51" r="3.6" fill="#1E293B" stroke="#64748B" strokeWidth="1" />
            <circle cx="18.2" cy="46" r="3.6" fill="#0F172A" stroke="#94A3B8" strokeWidth="1" />

            {/* Cannon Barrel(s) — tilts higher when 架炮 (hasMountBuff) is active! */}
            <g transform={hasMountBuff ? 'rotate(-14 32 38)' : 'rotate(0 32 38)'}>
              {isMax ? (
                /* 3★ Twin-Barrel Heavy Siege Howitzer */
                <>
                  <path d="M21 40 L23 11 L30 11 L31 40 Z" fill="#B91C1C" stroke="#FACC15" strokeWidth="1.5" />
                  <path d="M33 40 L34 11 L41 11 L43 40 Z" fill="#B91C1C" stroke="#FACC15" strokeWidth="1.5" />
                  <ellipse cx="26.5" cy="11" rx="3.8" ry="1.8" fill="#111827" stroke="#FDE047" strokeWidth="1.2" />
                  <ellipse cx="37.5" cy="11" rx="3.8" ry="1.8" fill="#111827" stroke="#FDE047" strokeWidth="1.2" />
                </>
              ) : (
                /* 1★/2★ Cast-Bronze & Crimson Heavy Barrel Pointing Forward (Up) */
                <>
                  <path d="M24 42 L26 11 L38 11 L40 42 Z" fill={isMid ? '#B91C1C' : '#92400E'} stroke="#FACC15" strokeWidth="1.7" />
                  {/* Brass Reinforcing Rings (炮箍) */}
                  <line x1="25" y1="20" x2="39" y2="20" stroke="#FACC15" strokeWidth="2.4" />
                  <line x1="24.5" y1="30" x2="39.5" y2="30" stroke="#FACC15" strokeWidth="2.4" />
                  {/* Dark Cannon Muzzle Bore */}
                  <ellipse cx="32" cy="11" rx="6" ry="2.4" fill="#0F172A" stroke="#FDE047" strokeWidth="1.4" />
                </>
              )}
              {/* Breech Knob & Burning Fuse Spark */}
              <circle cx="32" cy="44" r="3.2" fill="#D97706" />
              <path d="M35 43 Q43 40 45 33" fill="none" stroke="#FDE047" strokeWidth="1.6" />
              <circle cx="45" cy="33" r="2.8" fill="#FB923C" />
              <circle cx="45" cy="33" r="1.3" fill="#FEF08A" />
            </g>

            {/* Left & Right Spoked Wooden Wheels */}
            <circle cx="20" cy="45" r="7" fill="#451A03" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="20" cy="45" r="2" fill="#FACC15" />
            <circle cx="44" cy="45" r="7" fill="#451A03" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="44" cy="45" r="2" fill="#FACC15" />
          </g>
        )}

        {/* ── 車: 实体四轮装甲床弩战车 + 前撞角 + 上膛破甲重箭 ── */}
        {type === 'che' && (
          <g>
            {/* 4 Wooden/Iron Wheels */}
            <rect x="13" y="18" width="4" height="10" rx="1.5" fill="#451A03" stroke="#D97706" strokeWidth="1.2" />
            <rect x="47" y="18" width="4" height="10" rx="1.5" fill="#451A03" stroke="#D97706" strokeWidth="1.2" />
            <rect x="13" y="38" width="4" height="11" rx="1.5" fill="#451A03" stroke="#D97706" strokeWidth="1.2" />
            <rect x="47" y="38" width="4" height="11" rx="1.5" fill="#451A03" stroke="#D97706" strokeWidth="1.2" />
            {/* Front Steel Ramming Spikes (破阵撞角) */}
            <polygon points="21,14 24,7 27,14" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
            <polygon points="37,14 40,7 43,14" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
            {/* Armored Chariot Hull */}
            <rect x="18" y="14" width="28" height="36" rx="4" fill="#1E3A8A" stroke="#93C5FD" strokeWidth="1.8" />
            <rect x="21" y="18" width="22" height="28" rx="2" fill="#78350F" stroke="#F59E0B" strokeWidth="1.2" />
            {/* Heavy Bronze Ballista Bow Arms (三弓床弩) */}
            <path d="M11 27 Q32 16 53 27" fill="none" stroke="#FACC15" strokeWidth="3.4" strokeLinecap="round" />
            {/* Taut Bowstring */}
            <polyline points="12,27 32,41 52,27" fill="none" stroke="#E2E8F0" strokeWidth="1.4" />
            {/* Loaded Heavy Steel Bolt Pointing Up */}
            <line x1="32" y1="44" x2="32" y2="9" stroke="#FDE047" strokeWidth="3" />
            <polygon points="32,4 27,13 37,13" fill="#F8FAFC" stroke="#0284C7" strokeWidth="1.2" />
          </g>
        )}

        {/* ── 兵: 实体重型铆钉铁盾 + 拒马木刺 + 寒铁长枪 ── */}
        {type === 'bing' && (
          <g>
            {/* Crossed Wooden Cheval-de-Frise Spikes (拒马木刺) */}
            <line x1="11" y1="48" x2="25" y2="14" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
            <line x1="53" y1="48" x2="39" y2="14" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
            {/* Twin Steel Pikes Jutting Forward */}
            <line x1="22" y1="50" x2="22" y2="9" stroke="#92400E" strokeWidth="2.4" />
            <polygon points="22,4 19,12 25,12" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
            <line x1="42" y1="50" x2="42" y2="9" stroke="#92400E" strokeWidth="2.4" />
            <polygon points="42,4 39,12 45,12" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
            {/* Heavy Iron-Rimmed Tower Shield (步人重盾) */}
            <path
              d="M19 19 Q32 15 45 19 L43 49 Q32 54 21 49 Z"
              fill={isMax ? '#991B1B' : '#065F46'}
              stroke="#FACC15"
              strokeWidth="2.2"
            />
            {/* Brass Tiger/Boss Shield Center */}
            <circle cx="32" cy="34" r="6.5" fill="#F59E0B" stroke="#FEF08A" strokeWidth="1.4" />
            <circle cx="32" cy="34" r="2.5" fill="#78350F" />
          </g>
        )}

        {/* ── 馬: 实体披甲战马 + 青龙偃月斩马长刀 ── */}
        {type === 'ma' && (
          <g>
            {/* Warhorse Neck & Head Profile with Iron Chamfron */}
            <path
              d="M18 52 L20 28 L15 22 L23 13 L31 16 L36 25 L35 52 Z"
              fill={isMax ? '#F8FAFC' : '#92400E'}
              stroke="#451A03"
              strokeWidth="1.6"
            />
            {/* Red Plume & Golden Horse Forehead Armor (马面甲) */}
            <path d="M23 13 Q18 6 27 8 Z" fill="#EF4444" />
            <polygon points="22,14 16,22 21,24 26,16" fill="#FACC15" stroke="#78350F" strokeWidth="1" />
            {/* Horse Eye & Bridle Reins */}
            <circle cx="24" cy="19" r="1.5" fill="#0F172A" />
            <path d="M17 23 Q27 29 35 26" fill="none" stroke="#DC2626" strokeWidth="1.6" />
            {/* Gleaming Crescent Guan-Dao Polearm (偃月斩马长刀) */}
            <line x1="45" y1="53" x2="49" y2="12" stroke="#B45309" strokeWidth="2.8" />
            <path
              d="M49 7 Q58 13 54 24 L47 21 Z"
              fill="#E2E8F0"
              stroke="#FACC15"
              strokeWidth="1.3"
            />
            <circle cx="48" cy="22" r="2.2" fill="#EF4444" />
          </g>
        )}

        {/* ── 相: 实体城防箭楼 + 诸葛连弩匣 + 牛皮战鼓 ── */}
        {type === 'xiang' && (
          <g>
            {/* Brick & Timber Watchtower Base */}
            <polygon points="18,52 22,26 42,26 46,52" fill="#5B21B6" stroke="#FACC15" strokeWidth="1.6" />
            {/* Crenellated Battlement Top */}
            <rect x="18" y="21" width="28" height="6" rx="1" fill="#78350F" stroke="#FCD34D" strokeWidth="1.4" />
            {/* Mounted Zhuge Repeating Crossbow (诸葛连弩木匣) */}
            <path d="M16 18 Q32 10 48 18" fill="none" stroke="#FACC15" strokeWidth="2.6" />
            <rect x="27" y="11" width="10" height="12" rx="2" fill="#B45309" stroke="#FEF08A" strokeWidth="1.2" />
            {/* 3 Feathered Bolts Ready to Fire */}
            <line x1="29" y1="12" x2="29" y2="5" stroke="#E2E8F0" strokeWidth="1.6" />
            <line x1="32" y1="12" x2="32" y2="4" stroke="#FDE047" strokeWidth="1.8" />
            <line x1="35" y1="12" x2="35" y2="5" stroke="#E2E8F0" strokeWidth="1.6" />
            {/* Crimson War Drum at Tower Front (助威战鼓) */}
            <circle cx="32" cy="40" r="7.5" fill="#FEF3C7" stroke="#DC2626" strokeWidth="2.4" />
            <circle cx="32" cy="40" r="2.5" fill="#DC2626" />
          </g>
        )}
      </svg>

      {/* Chess Unit Corner Badge */}
      <span className={`chibi-role-pill role-${type}`}>
        {type === 'che' ? '車' : type === 'pao' ? '炮' : type === 'ma' ? '馬' : type === 'bing' ? '兵' : '相'}
      </span>

      {/* Star Upgrade Level */}
      <span className={`chibi-star-strip star-${star}`}>
        {isMax ? '★★★重器' : isMid ? '★★' : '★'}
      </span>

      {/* Cannon Screen-Mount Bonus Indicator */}
      {hasMountBuff && (
        <span className="chibi-mount-tag" title="正前方同列有友军充当炮架，已切换为仰射开花炸弹（2倍范围伤害）!">
          🎯架炮×2
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

