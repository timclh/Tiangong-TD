/**
 * Tiangong Celestial Court TD — Game Data, Balance & AI Visual Asset Manifest
 *
 * Step 1: Core gameplay data (5 Xiangqi Celestial Towers with 1★->2★->3★ evolution,
 *         15 Abyssal Demon waves & Bosses, 9 Roguelike Celestial Decrees).
 * Step 2: AI visual asset manifest (`AI_VISUAL_SLOTS`) with seamless procedural
 *         celestial SVG/Canvas rendering when external MP4/WebP files are not present.
 */

export const GRID_COLS = 7;
export const GRID_ROWS = 8;
export const RIVER_ROW = 3; // 天河弱水 row (slows demons by 35%)
export const CORE_POS = { row: 7, col: 3 }; // 南天门 · 凌霄宝殿

/**
 * Optional drop-in AI video/image assets in `public/tiangong/`.
 * If a file is placed in `public/tiangong/` and fails to load, the UI
 * automatically falls back to the built-in procedural celestial animation.
 */
export const AI_VISUAL_SLOTS = {
  backgroundLoopVideo: `${process.env.PUBLIC_URL || ''}/tiangong/bg-tiangong-loop.mp4`,
  awakeningVideos: {
    bing: `${process.env.PUBLIC_URL || ''}/tiangong/ult-lijing.mp4`,
    che: `${process.env.PUBLIC_URL || ''}/tiangong/ult-leizhenzi.mp4`,
    ma: `${process.env.PUBLIC_URL || ''}/tiangong/ult-erlang.mp4`,
    pao: `${process.env.PUBLIC_URL || ''}/tiangong/ult-nezha.mp4`,
    xiang: `${process.env.PUBLIC_URL || ''}/tiangong/ult-wukong.mp4`,
  },
  portraits: {
    bing: `${process.env.PUBLIC_URL || ''}/tiangong/portrait-lijing.webp`,
    che: `${process.env.PUBLIC_URL || ''}/tiangong/portrait-leizhenzi.webp`,
    ma: `${process.env.PUBLIC_URL || ''}/tiangong/portrait-erlang.webp`,
    pao: `${process.env.PUBLIC_URL || ''}/tiangong/portrait-nezha.webp`,
    xiang: `${process.env.PUBLIC_URL || ''}/tiangong/portrait-wukong.webp`,
  },
};

export const KILLS_PER_SKILL = 8; // 每消灭 8 名敌军，立即获得 1 次免费【兵法技能改装】

/**
 * 3 Direct Silver-Coin Armory Upgrades (铁匠军械坊 · 随时花银两升级实体器械)
 */
export const ARMORY_UPGRADES = {
  gunpowder: {
    id: 'gunpowder',
    name: '火药扩容',
    icon: '🧨',
    baseCost: 50,
    costStep: 25,
    shortEffect: '火炮/齐射伤害+28% · 弹坑扩大',
  },
  mechanism: {
    id: 'mechanism',
    name: '精钢机括',
    icon: '⚙️',
    baseCost: 50,
    costStep: 25,
    shortEffect: '全军装填射速+18% · 弩箭加速',
  },
  barricade: {
    id: 'barricade',
    name: '铁壁拒马',
    icon: '🛡️',
    baseCost: 45,
    costStep: 20,
    shortEffect: '立即修补城门+4血 · 盾兵枪刺增伤',
  },
};

/**
 * 5 Physical Chess War-Machine Towers (实体军械棋子防御塔)
 * Attack patterns follow physical ballistics + authentic Chinese Chess (Xiangqi) rules:
 * - 兵 (bing): Heavy Iron Tower Shield + Pike Barricade (实体盾墙堵路 + 前方1格长枪突刺 + 最佳炮架)
 * - 車 (che): Armored Ballista War Chariot (只打本列直线的重型破甲弩箭 + 直线碾压冲锋，绝不乱扫全屏)
 * - 馬 (ma): Barded Warhorse Cavalry + Crescent Guan-Dao (近身挥砍暴击 + 象棋“日”字跃马跳劈)
 * - 炮 (pao): Wheeled Bronze/Crimson Cannon (本列平射实心铁弹；前方同列有友军做【炮架】时，翻山抛射开花炸弹×2倍范围轰炸！)
 * - 相 (xiang): Zhuge Repeating Crossbow & War-Drum Watchtower (扇形连射羽箭 + 擂鼓提升邻格装填攻速)
 */
export const TOWER_TYPES = {
  bing: {
    id: 'bing',
    glyph: '兵',
    color: '#52C4A3',
    accent: '#9BF0D6',
    role: '实体铁盾拦路 · 前排最佳炮架',
    patternLabel: '阻挡本列敌军 + 前方1.5格长枪刺击',
    baseDamage: 28,
    cooldownMs: 920,
    range: 1.65,
    tiers: {
      1: { name: '铁盾长枪卒', title: '拒马前锋', scale: 1.0, dmgMult: 1.0 },
      2: { name: '重甲陷阵盾卫', title: '铁壁连城', scale: 1.85, dmgMult: 2.2 },
      3: {
        name: '托塔神威铁卫',
        title: '不动铁壁 · 镇关重盾',
        deityQuote: '重盾如山立阵前，十万敌军难越雷池！',
        awakeningSkill: '铁盾重锤猛击地面，震退全场敌军并定身 2.5 秒！',
        scale: 3.2,
        dmgMult: 4.8,
      },
    },
  },
  che: {
    id: 'che',
    glyph: '車',
    color: '#6FA8FF',
    accent: '#C4DCFF',
    role: '重装床弩战车 · 本列直线穿甲',
    patternLabel: '本列发射穿甲重箭 (穿透3敌) + 直线冲撞',
    baseDamage: 40,
    cooldownMs: 1180,
    range: 7.5,
    tiers: {
      1: { name: '轻型床弩战车', title: '直线破甲', scale: 1.0, dmgMult: 1.0 },
      2: { name: '精钢三弓床弩车', title: '贯甲重箭', scale: 1.9, dmgMult: 2.3 },
      3: {
        name: '雷震子·破阵巨辇',
        title: '重装战车 · 纵贯千军',
        deityQuote: '战轮滚滚破铁甲，三弓重箭贯长虹！',
        awakeningSkill: '战车全速发射满弦破甲巨箭，贯穿重创场上所有敌军！',
        scale: 3.3,
        dmgMult: 5.0,
      },
    },
  },
  ma: {
    id: 'ma',
    glyph: '馬',
    color: '#F0CF86',
    accent: '#FFF0C2',
    role: '玄甲铁骑长刀 · 日字跃马跳劈',
    patternLabel: '周身1.8格挥刀暴击 + 点击“日”字格跳劈',
    baseDamage: 50,
    cooldownMs: 1020,
    range: 1.95,
    critChance: 0.38,
    tiers: {
      1: { name: '玄甲轻骑兵', title: '斩马快刀', scale: 1.0, dmgMult: 1.0 },
      2: { name: '重装铁浮屠', title: '偃月裂甲', scale: 1.9, dmgMult: 2.3 },
      3: {
        name: '二郎显圣真君',
        title: '神锋铁骑 · 三尖两刃',
        deityQuote: '铁骑突出刀枪鸣，三尖两刃斩敌酋！',
        awakeningSkill: '策马腾空斩出满月刀罡，重创全场敌军并触发暴击流血！',
        scale: 3.4,
        dmgMult: 5.2,
      },
    },
  },
  pao: {
    id: 'pao',
    glyph: '炮',
    color: '#E5594B',
    accent: '#FFB3A8',
    role: '红衣火炮 · 同列架炮翻山开花弹',
    patternLabel: '无架:本列平射铁弹 | 同列前排有友军:翻山抛射2倍开花炸弹!',
    baseDamage: 46,
    cooldownMs: 1480,
    range: 7.0,
    splashRadius: 1.35,
    tiers: {
      1: { name: '虎蹲轻型火炮', title: '实心铁弹', scale: 1.0, dmgMult: 1.0 },
      2: { name: '红衣攻城重炮', title: '隔山开花弹', scale: 1.9, dmgMult: 2.35 },
      3: {
        name: '哪吒·双管神威巨炮',
        title: '双管重炮 · 焦土榴弹',
        deityQuote: '前军立盾作炮架，红衣重炮隔山轰！',
        awakeningSkill: '双管齐射高爆燃烧重弹，全盘轰炸并留下焦土火坑！',
        scale: 3.4,
        dmgMult: 5.2,
      },
    },
  },
  xiang: {
    id: 'xiang',
    glyph: '相',
    color: '#D88CFF',
    accent: '#F3D6FF',
    role: '诸葛连弩箭楼 · 战鼓装填加速',
    patternLabel: '2.5格连射羽箭 + 擂鼓使周围友军射速+30%',
    baseDamage: 24,
    cooldownMs: 780,
    range: 2.55,
    auraSpeedBonus: 0.30,
    tiers: {
      1: { name: '哨岗连弩台', title: '速射羽箭', scale: 1.0, dmgMult: 1.0 },
      2: { name: '战鼓诸葛箭楼', title: '擂鼓助战', scale: 1.9, dmgMult: 2.2 },
      3: {
        name: '八阵神机弩楼',
        title: '万箭齐发 · 战鼓雷鸣',
        deityQuote: '诸葛连弩机括响，城头战鼓催三军！',
        awakeningSkill: '箭楼万箭齐发覆盖全场，并令全军装填速度大幅飙升！',
        scale: 3.5,
        dmgMult: 5.2,
      },
    },
  },
};

export const TOWER_KEYS = Object.keys(TOWER_TYPES);

/**
 * Roguelike 3-Choice Celestial Decrees (天道法旨)
 */
export const CELESTIAL_DECREES = [
  {
    id: 'fatian_xiangdi',
    name: '【重锻神兵】',
    tag: '高星强化',
    desc: '所有 2★ 与 3★ 器械伤害 +45%，暴击伤害提升至 250%',
    icon: 'crown',
  },
  {
    id: 'sanmei_zhenhuo',
    name: '【高爆开花弹】',
    tag: '火炮改装',
    desc: '【炮】爆炸弹坑范围扩大 45%，且弹片引燃地面每秒烧血 35 点',
    icon: 'streak',
  },
  {
    id: 'jiutian_shenlei',
    name: '【三弓破甲箭】',
    tag: '弩车改装',
    desc: '【車】穿甲巨箭伤害 +40%、穿透人数 +2，并附带击退钉死效果',
    icon: 'zap',
  },
  {
    id: 'tianyan_dongxi',
    name: '【斩马重刃】',
    tag: '铁骑改装',
    desc: '【馬】挥刀暴击率提升至 65%，且每次挥砍同时劈中 2 名敌兵',
    icon: 'target',
  },
  {
    id: 'wanxian_laichao',
    name: '【军工回炉】',
    tag: '合成返利',
    desc: '每次合成升星时，立即返还 💰25两白银 并缩短全军装填时间 15%',
    icon: 'sparkles',
  },
  {
    id: 'sadou_chengbing',
    name: '【悬赏缴获】',
    tag: '银两经济',
    desc: '立即获得 💰90两军饷，且每消灭 1 名敌兵掉落银两 +30%',
    icon: 'gem',
  },
  {
    id: 'ruoshui_tianhe',
    name: '【护城陷马河】',
    tag: '地形控制',
    desc: '护城河减速效果翻倍（减速 65%），趟水的敌军受到炮矢伤害 +35%',
    icon: 'layers',
  },
  {
    id: 'pantao_shenghui',
    name: '【加固城垣】',
    tag: '城门续航',
    desc: '城门立即恢复 6 点耐久与上限，且全军装填速度 +20%',
    icon: 'star',
  },
  {
    id: 'lingxiao_jianzhen',
    name: '【城头万炮齐鸣】',
    tag: '齐射改装',
    desc: '城楼齐射重炮威力提升 80%，且每次释放后保留 25% 火药余量',
    icon: 'challenge',
  },
];

/**
 * 15 Waves of Abyssal Demons & Mythic Bosses
 */
export const WAVES = [
  { wave: 1, title: '第一波 · 九幽魔卒叩关', count: 7, hp: 75, speed: 0.58, reward: 14, kind: '卒', boss: null },
  { wave: 2, title: '第二波 · 血煞妖骑突袭', count: 9, hp: 105, speed: 0.72, reward: 15, kind: '骑', boss: null },
  {
    wave: 3,
    title: '第三波 · 妖王降临：平天大圣·牛魔王',
    count: 8,
    hp: 135,
    speed: 0.62,
    reward: 16,
    kind: '卒',
    boss: { name: '牛魔王 · 平天法相', glyph: '牛', hp: 780, speed: 0.42, reward: 80 },
  },
  { wave: 4, title: '第四波 · 玄冥重甲妖军', count: 11, hp: 190, speed: 0.55, reward: 16, kind: '甲', boss: null },
  { wave: 5, title: '第五波 · 域外修罗急行军', count: 13, hp: 230, speed: 0.78, reward: 17, kind: '修', boss: null },
  {
    wave: 6,
    title: '第六波 · 凶神降临：九婴·凶水魔神',
    count: 12,
    hp: 270,
    speed: 0.65,
    reward: 18,
    kind: '甲',
    boss: { name: '九婴 · 凶水魔神', glyph: '嬰', hp: 1650, speed: 0.44, reward: 110 },
  },
  { wave: 7, title: '第七波 · 黑风妖王先锋营', count: 14, hp: 350, speed: 0.7, reward: 18, kind: '骑', boss: null },
  { wave: 8, title: '第八波 · 炼狱魔化战车', count: 15, hp: 440, speed: 0.62, reward: 20, kind: '魔', boss: null },
  {
    wave: 9,
    title: '第九波 · 巨妖降临：北冥鲲鹏法相',
    count: 15,
    hp: 520,
    speed: 0.68,
    reward: 20,
    kind: '修',
    boss: { name: '鲲鹏 · 北冥巨妖', glyph: '鯤', hp: 3100, speed: 0.46, reward: 140 },
  },
  { wave: 10, title: '第十波 · 狮驼岭十万妖潮', count: 17, hp: 640, speed: 0.74, reward: 22, kind: '魔', boss: null },
  { wave: 11, title: '第十一波 · 混沌裂隙狂暴军', count: 18, hp: 780, speed: 0.78, reward: 22, kind: '骑', boss: null },
  {
    wave: 12,
    title: '第十二波 · 凶兽降临：上古穷奇',
    count: 18,
    hp: 920,
    speed: 0.72,
    reward: 24,
    kind: '魔',
    boss: { name: '穷奇 · 上古凶兽', glyph: '窮', hp: 5200, speed: 0.48, reward: 180 },
  },
  { wave: 13, title: '第十三波 · 阿修罗血海大军', count: 20, hp: 1150, speed: 0.76, reward: 25, kind: '修', boss: null },
  { wave: 14, title: '第十四波 · 诸天劫火魔卫', count: 22, hp: 1400, speed: 0.8, reward: 26, kind: '魔', boss: null },
  {
    wave: 15,
    title: '最终决战 · 魔祖罗睺·吞天法相',
    count: 22,
    hp: 1650,
    speed: 0.76,
    reward: 28,
    kind: '魔',
    boss: { name: '罗睺 · 魔祖吞天法相', glyph: '魔', hp: 9200, speed: 0.44, reward: 300 },
  },
];
