/**
 * 《天宫弈 · 南天门守卫战》 (Tiangong Celestial Court Tower Defense)
 *
 * Step 1: Playable iOS-first Celestial Chess Merge & Roguelike Tower Defense
 *   - 7x8 Celestial Star-Board on a 2.5D TiltStage
 *   - 5 Xiangqi Deity Towers (兵/車/馬/炮/相) with 1★ -> 2★ -> 3★ (法天象地) merge evolution
 *   - Xiangqi-authentic attack patterns (Cross Lightning, Parabolic Samadhi Fireballs,
 *     Knight Jump Crit Slash, Nine-Palace Shockwave, Jade Pool Aura + Staff Sweep)
 *   - 15 Waves of Abyssal Demons + 5 Mythic Bosses (Bull King, Hydra, Kunpeng, Qiongqi, Rahu)
 *   - Roguelike 3-Choice "天道法旨" (Celestial Decrees) between waves
 *
 * Step 2: AI Visual Empowerment & "法天象地" Awakening Cinematic
 *   - Built-in procedural golden cloud sea, constellation star-grid, laser/fireball FX
 *   - 3★ Awakening full-screen cut-in modal with board-wide divine strike
 *   - Drop-in video/portrait slots (`public/tiangong/*.mp4`) with seamless fallback
 */

import React, { Component } from 'react';
import './TiangongTD.css';
import TiltStage from './components/TiltStage';
import { Icon } from './components/Icon';
import { DeityChibi, DemonChibi, MentorChibi } from './components/ChibiAvatar';
import {
  GRID_COLS,
  GRID_ROWS,
  RIVER_ROW,
  CORE_POS,
  AI_VISUAL_SLOTS,
  KILLS_PER_SKILL,
  ARMORY_UPGRADES,
  TOWER_TYPES,
  TOWER_KEYS,
  CELESTIAL_DECREES,
  WAVES,
} from './data/tiangongAssets';
import { playSound, SOUND } from './services/SoundService';
import { hapticTap, hapticImpact, hapticNotification } from './services/CapacitorService';
import { boardTiltDegrees } from './services/ViewportService';

const TICK_MS = 80;
const BASE_SUMMON_COST = 40;
const TUTORIAL_STORAGE_KEY = 'tiangong_tutorial_v2_done';

function isTutorialCompletedStorage() {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === '1';
  } catch (_) {
    return false;
  }
}

function markTutorialCompletedStorage() {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
  } catch (_) {
    // ignore storage errors in private mode
  }
}

export const TUTORIAL_STEPS = {
  1: {
    step: 1,
    title: '第 1/5 步 · 花军饷招募器械',
    body: '将军！敌军正从上方关口攻向底部【城门】！每杀1敌会掉落💰白银与🎖️军功。先点下方红色【招募器械】（花40两）部署新战车！',
    pointerText: '👆 点这里募兵!',
  },
  2: {
    step: 2,
    title: '第 2/5 步 · 两台同型器械合体升星',
    body: '场上有了两台【1★ 車·床弩战车】！点击绿色【一键合阵】，将两台轻弩车改装合体为【2★ 三弓重弩战车】！',
    pointerText: '👆 点此合体升2★!',
  },
  3: {
    step: 3,
    title: '第 3/5 步 ·【車】直线破甲箭 & 战车冲撞',
    body: '【車】只沿本列正前方发射实体穿甲重箭（不乱扫全屏）！点击它正前方发光轨道格，发动【🛞战车冲撞】碾压本列敌兵！',
    pointerText: '👆 点此格战车冲撞!',
  },
  4: {
    step: 4,
    title: '第 4/5 步 ·【炮】真象棋“架炮翻山”规则',
    body: '重点！【炮】正前方同列有友军当【炮架】时，自动仰射【🎯隔山开花炸弹（2倍范围爆炸）】；无炮架则平射单发铁弹！点前方河道定点炮击！',
    pointerText: '👆 点此定点炮击!',
  },
  5: {
    step: 5,
    title: '第 5/5 步 · 加技能方式 & 城楼万炮齐射',
    body: '怎么加技能？①下方【铁匠军械坊】随时花银两加点火药/射速；②每满8杀点上方【🎁领技能】三选一！现在点右下【🧨万炮齐射】开战！',
    pointerText: '👆 点此万炮齐射!',
  },
};

let nextEntityId = 1;
function uid(prefix = 'id') {
  nextEntityId += 1;
  return `${prefix}_${nextEntityId}`;
}

export function isDeployableCell(row, col) {
  if (row <= 0 || row >= GRID_ROWS) return false;
  if (row === RIVER_ROW) return false;
  if (row === CORE_POS.row && col === CORE_POS.col) return false;
  return col >= 0 && col < GRID_COLS;
}

/**
 * Xiangqi Cannon Screen-Mount rule (隔山打牛 · 同列炮架子):
 * Returns true if `paoTower` has at least one allied unit strictly in the SAME column
 * in front of it (`other.col === paoTower.col && other.row < paoTower.row`) acting as a spotter/mount!
 */
export function hasCannonMount(paoTower, allTowers) {
  if (!paoTower || paoTower.type !== 'pao') return false;
  return allTowers.some(
    (other) =>
      other.id !== paoTower.id &&
      other.col === paoTower.col &&
      other.row < paoTower.row
  );
}

/**
 * Xiangqi Knight "日"-jump check
 */
export function isKnightJump(r1, c1, r2, c2) {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
}

function computeBoardWidth() {
  if (typeof window === 'undefined') return 364;
  const vw = window.innerWidth || 390;
  const vh = window.innerHeight || 844;
  const maxByWidth = Math.min(vw - 28, 476);
  const maxByHeight = Math.max(294, Math.floor((vh - 300) * (GRID_COLS / GRID_ROWS)));
  return Math.max(294, Math.min(maxByWidth, maxByHeight));
}

class TiangongTD extends Component {
  constructor(props) {
    super(props);
    this.state = this.createInitialState();
  }

  createInitialState({ forceTutorial = false } = {}) {
    const startTutorial = forceTutorial || !isTutorialCompletedStorage();
    // Start with 2 pre-deployed 1★ Celestial Towers (車 in front as cannon mount, 炮 behind it!)
    const starterTowers = [
      { id: uid('tw'), type: 'che', star: 1, row: 4, col: 3, lastShotAt: 0, skillReadyAt: 0 },
      { id: uid('tw'), type: 'pao', star: 1, row: 5, col: 3, lastShotAt: 0, skillReadyAt: 0 },
    ];
    const tutorialDummies = startTutorial
      ? [
          {
            id: uid('em'),
            name: '试炼魔卒',
            glyph: '卒',
            isBoss: false,
            hp: 260,
            maxHp: 260,
            speed: 0.58,
            reward: 15,
            col: 3,
            row: 1.35,
            slowUntil: 0,
            burnUntil: 0,
          },
          {
            id: uid('em'),
            name: '试炼妖骑',
            glyph: '骑',
            isBoss: false,
            hp: 280,
            maxHp: 280,
            speed: 0.62,
            reward: 15,
            col: 3,
            row: 3.0,
            slowUntil: 0,
            burnUntil: 0,
          },
        ]
      : [];

    return {
      boardWidth: computeBoardWidth(),
      tiltEnabled: true,
      speedMultiplier: 1,
      isPaused: false,
      tutorialStep: startTutorial ? 1 : null, // 1..5 interactive hands-on onboarding
      showGuideModal: false,
      cannonAimMode: false, // when true and a 炮 is selected, next board click bombards that spot!
      waveIndex: 0, // 0-based index into WAVES (0..14)
      stones: 140, // 战利白银军饷
      summonCount: 0,
      coreHp: 20,
      maxCoreHp: 20,
      score: 0,
      kills: 0,
      pendingSkills: 0, // Unclaimed 8-kill merit skill upgrades
      armory: {
        gunpowder: 1, // 🧨 火药扩容等级
        mechanism: 1, // ⚙️ 精钢机括等级
        barricade: 1, // 🛡️ 铁壁拒马等级
      },
      ultCharge: 45, // 0..100 for 城楼万炮齐射
      towers: starterTowers,
      selectedTowerId: starterTowers[0].id, // pre-select 車 so user immediately sees its cross rail & controls!
      enemies: tutorialDummies,
      spawnQueue: this.buildWaveSpawnQueue(0),
      spawnCooldownMs: 400,
      fireZones: [], // [{ id, row, col, radius, expiresAt }] from 哪吒三昧火莲定点轰炸
      fxBeams: [], // transient SVG attack effects
      floatTexts: [], // floating damage popups
      activeDecrees: [], // array of decree ids
      decreeChoices: null, // array of 3 decrees when between waves
      awakeningCutIn: null, // { type, towerName, title, quote, skill }
      bgVideoOk: true,
      awakeningVideoOk: {},
      gameResult: null, // 'victory' | 'defeat' | null
    };
  }

  componentDidMount() {
    this.handleResize = () => {
      this.setState({ boardWidth: computeBoardWidth() });
    };
    window.addEventListener('resize', this.handleResize);
    this.startLoop();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    this.stopLoop();
  }

  startLoop() {
    this.stopLoop();
    this.loopTimer = setInterval(this.tick, TICK_MS);
  }

  stopLoop() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  buildWaveSpawnQueue(waveIndex) {
    const waveDef = WAVES[waveIndex] || WAVES[0];
    const queue = [];
    for (let i = 0; i < waveDef.count; i += 1) {
      const col = (i * 2 + (waveIndex % 3)) % GRID_COLS;
      queue.push({
        id: uid('em'),
        name: waveDef.title,
        glyph: waveDef.kind,
        isBoss: false,
        hp: waveDef.hp,
        maxHp: waveDef.hp,
        speed: waveDef.speed,
        reward: waveDef.reward,
        col: col + (Math.random() * 0.24 - 0.12),
        row: 0.15,
        slowUntil: 0,
        burnUntil: 0,
      });
    }
    if (waveDef.boss) {
      queue.push({
        id: uid('boss'),
        name: waveDef.boss.name,
        glyph: waveDef.boss.glyph,
        isBoss: true,
        hp: waveDef.boss.hp,
        maxHp: waveDef.boss.hp,
        speed: waveDef.boss.speed,
        reward: waveDef.boss.reward,
        col: CORE_POS.col,
        row: 0.1,
        slowUntil: 0,
        burnUntil: 0,
      });
    }
    return queue;
  }

  hasDecree(id) {
    return this.state.activeDecrees.includes(id);
  }

  getSummonCost() {
    return BASE_SUMMON_COST + Math.min(60, this.state.summonCount * 5);
  }

  // ── Core Simulation Tick ──────────────────────────────────────

  tick = () => {
    const {
      isPaused,
      tutorialStep,
      showGuideModal,
      decreeChoices,
      awakeningCutIn,
      gameResult,
      speedMultiplier,
    } = this.state;

    if (isPaused || showGuideModal || decreeChoices || awakeningCutIn || gameResult) {
      return;
    }

    // While in the hands-on tutorial, freeze demon marching so the player has zero rush,
    // and only clean up finished beam/damage animations when needed.
    if (tutorialStep) {
      const nowTut = Date.now();
      if (
        this.state.fxBeams.some((b) => b.expiresAt <= nowTut) ||
        this.state.floatTexts.some((f) => f.expiresAt <= nowTut)
      ) {
        this.setState((prev) => ({
          fxBeams: prev.fxBeams.filter((b) => b.expiresAt > nowTut),
          floatTexts: prev.floatTexts.filter((f) => f.expiresAt > nowTut),
        }));
      }
      return;
    }

    const dtMs = TICK_MS * speedMultiplier;
    const now = Date.now();

    this.setState((prev) => {
      let {
        enemies,
        spawnQueue,
        spawnCooldownMs,
        towers,
        stones,
        coreHp,
        score,
        kills,
        pendingSkills,
        armory,
        ultCharge,
        fireZones,
        fxBeams,
        floatTexts,
        waveIndex,
        activeDecrees,
      } = prev;

      const hasDecree = (id) => activeDecrees.includes(id);
      const gpLv = (armory?.gunpowder || 1) - 1;
      const mechLv = (armory?.mechanism || 1) - 1;
      const barLv = (armory?.barricade || 1) - 1;
      const activeFireZones = (fireZones || []).filter((fz) => fz.expiresAt > now);
      let nextEnemies = enemies.map((e) => ({ ...e }));
      let nextQueue = spawnQueue;
      let nextSpawnWait = spawnCooldownMs - dtMs;

      // 1. Spawn next demon from queue
      if (nextQueue.length > 0 && nextSpawnWait <= 0) {
        const [spawned, ...rest] = nextQueue;
        nextEnemies.push(spawned);
        nextQueue = rest;
        nextSpawnWait = spawned.isBoss ? 1100 : 720;
      }

      // 2. Move enemies & apply burn / fireZone / river slow / 兵 physical shield-block
      const survivingEnemies = [];
      let hpLost = 0;
      let stonesEarned = 0;
      let killsEarned = 0;
      const newFloats = [];

      nextEnemies.forEach((enemy) => {
        if (enemy.burnUntil > now) {
          const burnDmg = ((hasDecree('sanmei_zhenhuo') ? 35 : 18) * (1 + gpLv * 0.2) * dtMs) / 1000;
          enemy.hp -= burnDmg;
        }
        const inFireZone = activeFireZones.some(
          (fz) => Math.hypot(enemy.row - fz.row, enemy.col - fz.col) <= fz.radius
        );
        if (inFireZone) {
          enemy.hp -= (45 * (1 + gpLv * 0.25) * dtMs) / 1000;
          enemy.slowUntil = Math.max(enemy.slowUntil, now + 400);
        }

        if (enemy.hp <= 0) {
          const rewardBonus = hasDecree('sadou_chengbing') ? 1.3 : 1.0;
          const loot = Math.round(enemy.reward * rewardBonus);
          stonesEarned += loot;
          killsEarned += 1;
          newFloats.push({
            id: uid('flt'),
            col: enemy.col,
            row: enemy.row,
            text: `💰+${loot}两`,
            crit: true,
            expiresAt: now + 680,
          });
          return;
        }

        // Physical Tower Shield block when a 兵 stands directly in front of the enemy
        const blockingGuard = towers.find(
          (t) =>
            t.type === 'bing' &&
            Math.abs(t.col - enemy.col) <= 0.58 &&
            t.row >= enemy.row &&
            t.row - enemy.row <= 0.72
        );

        const inRiver = enemy.row >= RIVER_ROW - 0.45 && enemy.row <= RIVER_ROW + 0.45;
        const riverSlow = inRiver ? (hasDecree('ruoshui_tianhe') ? 0.35 : 0.65) : 1.0;
        const debuffSlow = enemy.slowUntil > now ? 0.45 : 1.0;
        const guardSlow = blockingGuard ? 0.15 : 1.0;
        const step = (enemy.speed * riverSlow * debuffSlow * guardSlow * dtMs) / 1000;

        enemy.row += step;
        if (enemy.row > 5.0) {
          const dx = CORE_POS.col - enemy.col;
          enemy.col += Math.sign(dx) * Math.min(Math.abs(dx), step * 0.85);
        }

        if (enemy.row >= CORE_POS.row - 0.15) {
          hpLost += enemy.isBoss ? 5 : 1;
          newFloats.push({
            id: uid('flt'),
            col: CORE_POS.col,
            row: CORE_POS.row,
            text: enemy.isBoss ? '城门 -5!' : '城门 -1',
            crit: true,
            expiresAt: now + 600,
          });
        } else {
          survivingEnemies.push(enemy);
        }
      });

      nextEnemies = survivingEnemies;

      // 3. Physical War-Machines acquire targets & fire realistic projectiles
      const newBeams = [];
      const nextTowers = towers.map((t) => ({ ...t }));

      if (nextEnemies.length > 0) {
        nextTowers.forEach((tower) => {
          const spec = TOWER_TYPES[tower.type];
          const tierSpec = spec.tiers[tower.star] || spec.tiers[1];

          // War-drum reload speed bonus from adjacent 相 Watchtower + Armory 精钢机括 level
          let speedMult = (hasDecree('pantao_shenghui') ? 1.2 : 1.0) * (1 + mechLv * 0.18);
          nextTowers.forEach((other) => {
            if (other.id !== tower.id && other.type === 'xiang') {
              const dist = Math.hypot(other.row - tower.row, other.col - tower.col);
              if (dist <= 1.65) {
                speedMult += 0.28 * other.star;
              }
            }
          });

          const effectiveCooldown = spec.cooldownMs / speedMult;
          if (now - tower.lastShotAt < effectiveCooldown / speedMultiplier) {
            return;
          }

          let dmg = spec.baseDamage * tierSpec.dmgMult;
          if (tower.star >= 2 && hasDecree('fatian_xiangdi')) {
            dmg *= 1.45;
          }

          let fired = false;

          if (tower.type === 'che') {
            // 🛞 車 (Ballista War Chariot): Fires a physical armor-piercing bolt STRAIGHT UP ITS OWN COLUMN!
            const inLane = nextEnemies
              .filter((e) => Math.abs(e.col - tower.col) <= 0.78 && e.row <= tower.row + 0.35)
              .sort((a, b) => b.row - a.row); // closest in front first
            if (inLane.length > 0) {
              fired = true;
              const boltBoost = (hasDecree('jiutian_shenlei') ? 1.4 : 1.0) * (1 + mechLv * 0.12);
              const maxPierce = (hasDecree('jiutian_shenlei') ? 5 : 3) + (tower.star - 1);
              const pierced = inLane.slice(0, maxPierce);
              pierced.forEach((e) => {
                const riverVuln =
                  hasDecree('ruoshui_tianhe') && Math.abs(e.row - RIVER_ROW) <= 0.5 ? 1.35 : 1.0;
                const finalDmg = Math.round(dmg * boltBoost * riverVuln);
                e.hp -= finalDmg;
                if (hasDecree('jiutian_shenlei')) {
                  e.row = Math.max(0.2, e.row - 0.14);
                  e.slowUntil = Math.max(e.slowUntil, now + 900);
                }
              });
              const lastHit = pierced[pierced.length - 1];
              newFloats.push({
                id: uid('flt'),
                col: pierced[0].col,
                row: pierced[0].row,
                text: `🏹破甲 -${Math.round(dmg * boltBoost)}`,
                crit: pierced.length >= 2 || tower.star === 3,
                expiresAt: now + 500,
              });
              newBeams.push({
                id: uid('fx'),
                kind: 'bolt',
                fromCol: tower.col,
                fromRow: tower.row,
                toCol: tower.col,
                toRow: Math.max(0.2, lastHit.row - 0.3),
                color: spec.color,
                star: tower.star,
                expiresAt: now + 260,
              });
            }
          } else if (tower.type === 'pao') {
            // 🧨 炮 (Wheeled Artillery Cannon): Strict Forward Corridor + Authentic Xiangqi Mount Rule!
            // Look in this cannon's forward column corridor (never backwards or across the whole map!)
            const inCorridor = nextEnemies
              .filter((e) => Math.abs(e.col - tower.col) <= 1.05 && e.row <= tower.row + 0.25)
              .sort((a, b) => b.row - a.row);

            if (inCorridor.length > 0) {
              fired = true;
              const mounted = hasCannonMount(tower, nextTowers);
              const gunpowderMult = 1 + gpLv * 0.28;

              if (mounted) {
                // 🎯 WITH MOUNT (隔山架炮): High-arcing Explosive Shell over the friendly mount (2.0x AoE + burn)!
                const paoDmg = Math.round(dmg * 2.0 * gunpowderMult);
                const target = inCorridor[0];
                const splashR =
                  (spec.splashRadius || 1.35) *
                  (hasDecree('sanmei_zhenhuo') ? 1.45 : 1.0) *
                  (1 + gpLv * 0.08);
                nextEnemies.forEach((e) => {
                  if (Math.hypot(e.row - target.row, e.col - target.col) <= splashR) {
                    e.hp -= paoDmg;
                    e.burnUntil = Math.max(e.burnUntil, now + 2600);
                  }
                });
                newFloats.push({
                  id: uid('flt'),
                  col: target.col,
                  row: target.row,
                  text: `💥隔山开花弹 -${paoDmg}!`,
                  crit: true,
                  expiresAt: now + 560,
                });
                newBeams.push({
                  id: uid('fx'),
                  kind: 'arc_shell',
                  fromCol: tower.col,
                  fromRow: tower.row,
                  toCol: target.col,
                  toRow: target.row,
                  splashR,
                  color: spec.color,
                  star: tower.star,
                  expiresAt: now + 320,
                });
              } else {
                // ⚫ WITHOUT MOUNT (平射实心铁弹): Hits ONLY the first front-most enemy in lane + knockback!
                const paoDmg = Math.round(dmg * 1.0 * gunpowderMult);
                const firstEnemy = inCorridor[0];
                firstEnemy.hp -= paoDmg;
                firstEnemy.row = Math.max(0.2, firstEnemy.row - 0.22);
                newFloats.push({
                  id: uid('flt'),
                  col: firstEnemy.col,
                  row: firstEnemy.row,
                  text: `⚫铁弹平射 -${paoDmg}`,
                  crit: false,
                  expiresAt: now + 480,
                });
                newBeams.push({
                  id: uid('fx'),
                  kind: 'solid_ball',
                  fromCol: tower.col,
                  fromRow: tower.row,
                  toCol: firstEnemy.col,
                  toRow: firstEnemy.row,
                  color: '#94A3B8',
                  star: tower.star,
                  expiresAt: now + 240,
                });
              }
            }
          } else if (tower.type === 'ma') {
            // 🐎 馬 (Armored Cavalry): Close-range Guan-Dao crescent blade slash
            const inRange = nextEnemies.filter(
              (e) => Math.hypot(e.row - tower.row, e.col - tower.col) <= spec.range
            );
            if (inRange.length > 0) {
              fired = true;
              const maxTargets = hasDecree('tianyan_dongxi') ? 2 : 1;
              const critRate = hasDecree('tianyan_dongxi') ? 0.65 : spec.critChance;
              const critMult = hasDecree('fatian_xiangdi') ? 2.5 : 1.9;
              inRange.slice(0, maxTargets).forEach((target) => {
                const isCrit = Math.random() < critRate;
                const hitDmg = Math.round(dmg * (isCrit ? critMult : 1.0));
                target.hp -= hitDmg;
                if (tower.star >= 2) {
                  target.slowUntil = Math.max(target.slowUntil, now + 900);
                }
                newFloats.push({
                  id: uid('flt'),
                  col: target.col,
                  row: target.row,
                  text: isCrit ? `⚔️斩马暴击 -${hitDmg}!` : `-${hitDmg}`,
                  crit: isCrit,
                  expiresAt: now + 520,
                });
                newBeams.push({
                  id: uid('fx'),
                  kind: 'crescent',
                  fromCol: tower.col,
                  fromRow: tower.row,
                  toCol: target.col,
                  toRow: target.row,
                  color: spec.color,
                  star: tower.star,
                  expiresAt: now + 230,
                });
              });
            }
          } else if (tower.type === 'bing') {
            // 🛡️ 兵 (Tower Shield & Pikeman): Thrusts steel pikes at close-range enemies
            const inRange = nextEnemies.filter(
              (e) => Math.hypot(e.row - tower.row, e.col - tower.col) <= spec.range
            );
            if (inRange.length > 0) {
              fired = true;
              const pikeDmg = Math.round(dmg * (1 + barLv * 0.25));
              inRange.slice(0, 2).forEach((e) => {
                e.hp -= pikeDmg;
                e.slowUntil = Math.max(e.slowUntil, now + 1200);
              });
              newFloats.push({
                id: uid('flt'),
                col: inRange[0].col,
                row: inRange[0].row,
                text: `🛡️枪刺 -${pikeDmg}`,
                crit: tower.star === 3,
                expiresAt: now + 460,
              });
              newBeams.push({
                id: uid('fx'),
                kind: 'pike',
                fromCol: tower.col,
                fromRow: tower.row,
                toCol: inRange[0].col,
                toRow: inRange[0].row,
                color: spec.color,
                star: tower.star,
                expiresAt: now + 210,
              });
            }
          } else {
            // 🏹 相 (Zhuge Repeating Crossbow Watchtower): Rapid feathered arrows at nearby targets
            const inRange = nextEnemies.filter(
              (e) => Math.hypot(e.row - tower.row, e.col - tower.col) <= spec.range
            );
            if (inRange.length > 0) {
              fired = true;
              const target = inRange[0];
              const arrowDmg = Math.round(dmg * (1 + mechLv * 0.15));
              target.hp -= arrowDmg;
              newFloats.push({
                id: uid('flt'),
                col: target.col,
                row: target.row,
                text: `-${arrowDmg}`,
                crit: false,
                expiresAt: now + 420,
              });
              newBeams.push({
                id: uid('fx'),
                kind: 'arrow',
                fromCol: tower.col,
                fromRow: tower.row,
                toCol: target.col,
                toRow: target.row,
                color: '#FDE047',
                star: tower.star,
                expiresAt: now + 200,
              });
            }
          }

          if (fired) {
            tower.lastShotAt = now;
          }
        });
      }

      // Sweep enemies killed by tower shots this tick & drop visible Silver Coins!
      const afterShotEnemies = [];
      nextEnemies.forEach((e) => {
        if (e.hp <= 0) {
          const rewardBonus = hasDecree('sadou_chengbing') ? 1.3 : 1.0;
          const loot = Math.round(e.reward * rewardBonus);
          stonesEarned += loot;
          killsEarned += 1;
          newFloats.push({
            id: uid('flt'),
            col: e.col,
            row: e.row,
            text: `💰+${loot}两`,
            crit: true,
            expiresAt: now + 680,
          });
        } else {
          afterShotEnemies.push(e);
        }
      });

      const nextCoreHp = Math.max(0, coreHp - hpLost);
      const nextStones = stones + stonesEarned;
      const nextKills = kills + killsEarned;
      // Award +1 free Skill Upgrade every KILLS_PER_SKILL (8) enemies killed!
      const newlyUnlockedSkills =
        Math.floor(nextKills / KILLS_PER_SKILL) - Math.floor(kills / KILLS_PER_SKILL);
      const nextPendingSkills = (pendingSkills || 0) + Math.max(0, newlyUnlockedSkills);
      if (newlyUnlockedSkills > 0) {
        newFloats.push({
          id: uid('flt'),
          col: CORE_POS.col,
          row: 4.2,
          text: `🎖️歼敌满${nextKills}人！上方可领新技能！`,
          crit: true,
          expiresAt: now + 1200,
        });
      }

      const nextScore = score + killsEarned * 25 + stonesEarned;
      const chargeRate = hasDecree('lingxiao_jianzhen') ? 14 : 10;
      const nextUlt = Math.min(100, ultCharge + killsEarned * chargeRate);

      // Defeat check
      if (nextCoreHp <= 0) {
        playSound(SOUND.LOSE);
        hapticNotification('error');
        return {
          coreHp: 0,
          enemies: afterShotEnemies,
          gameResult: 'defeat',
        };
      }

      // Wave cleared check
      if (nextQueue.length === 0 && afterShotEnemies.length === 0) {
        if (waveIndex + 1 >= WAVES.length) {
          playSound(SOUND.WIN);
          hapticNotification('success');
          return {
            enemies: [],
            stones: nextStones + 100,
            kills: nextKills,
            score: nextScore + 1000,
            gameResult: 'victory',
          };
        }

        // Offer 3 Roguelike Celestial Decrees between waves!
        playSound(SOUND.WIN);
        const available = CELESTIAL_DECREES.filter((d) => !activeDecrees.includes(d.id));
        const pool = available.length >= 3 ? available : CELESTIAL_DECREES;
        const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);

        return {
          enemies: [],
          spawnQueue: [],
          stones: nextStones + 35,
          kills: nextKills,
          pendingSkills: nextPendingSkills,
          score: nextScore + 150,
          ultCharge: nextUlt,
          decreeChoices: shuffled,
          decreeSource: 'wave',
          fxBeams: [],
          floatTexts: [],
        };
      }

      return {
        enemies: afterShotEnemies,
        spawnQueue: nextQueue,
        spawnCooldownMs: nextSpawnWait,
        towers: nextTowers,
        stones: nextStones,
        coreHp: nextCoreHp,
        kills: nextKills,
        pendingSkills: nextPendingSkills,
        score: nextScore,
        ultCharge: nextUlt,
        fireZones: activeFireZones,
        fxBeams: [...fxBeams.filter((b) => b.expiresAt > now), ...newBeams].slice(-18),
        floatTexts: [...floatTexts.filter((f) => f.expiresAt > now), ...newFloats].slice(-16),
      };
    });
  };

  // ── Player Actions: Summon, Move, Merge, Ultimate, Decrees ────

  summonTower = () => {
    const cost = this.getSummonCost();
    const { stones, towers, gameResult, tutorialStep } = this.state;
    if (gameResult || stones < cost) return false;

    const occupied = new Set(towers.map((t) => `${t.row}-${t.col}`));
    const emptyCells = [];
    for (let r = 1; r < GRID_ROWS; r += 1) {
      for (let c = 0; c < GRID_COLS; c += 1) {
        if (isDeployableCell(r, c) && !occupied.has(`${r}-${c}`)) {
          emptyCells.push({ row: r, col: c });
        }
      }
    }
    if (emptyCells.length === 0) return false;

    // During Step 1 of tutorial, deterministically summon a 1★ 車 at (4, 1) so Step 2 merge is guaranteed!
    const tutorialSpot =
      tutorialStep === 1 && !occupied.has('4-1') ? { row: 4, col: 1 } : null;
    const spot = tutorialSpot || emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const type =
      tutorialStep === 1
        ? 'che'
        : TOWER_KEYS[Math.floor(Math.random() * TOWER_KEYS.length)];
    const newTower = {
      id: uid('tw'),
      type,
      star: 1,
      row: spot.row,
      col: spot.col,
      lastShotAt: 0,
      skillReadyAt: 0,
    };

    playSound(SOUND.PLACE);
    hapticTap();

    this.setState((prev) => ({
      stones: prev.stones - cost,
      summonCount: prev.summonCount + 1,
      towers: [...prev.towers, newTower],
      selectedTowerId: newTower.id,
      tutorialStep: prev.tutorialStep === 1 ? 2 : prev.tutorialStep,
    }));
    return true;
  };

  /**
   * Merge `sourceId` into `targetId` (same type, same star < 3).
   * When merging into 3★, triggers the "法天象地" Celestial Awakening Cut-in
   * and deals an immediate divine strike across all enemies on the board!
   */
  mergeTowers = (sourceId, targetId) => {
    const { towers } = this.state;
    const src = towers.find((t) => t.id === sourceId);
    const dst = towers.find((t) => t.id === targetId);
    if (!src || !dst || src.id === dst.id) return false;
    if (src.type !== dst.type || src.star !== dst.star || dst.star >= 3) return false;

    const newStar = dst.star + 1;
    const spec = TOWER_TYPES[dst.type];
    const tierInfo = spec.tiers[newStar];

    playSound(newStar === 3 ? SOUND.CHECK : SOUND.CAPTURE);
    hapticImpact();

    this.setState((prev) => {
      const hasWanxian = prev.activeDecrees.includes('wanxian_laichao');
      const rebate = hasWanxian ? 25 : 0;
      const nextTowers = prev.towers
        .filter((t) => t.id !== src.id)
        .map((t) => (t.id === dst.id ? { ...t, star: newStar, lastShotAt: 0 } : t));

      // If 3★ Awakening, also blast all current enemies on the board
      let nextEnemies = prev.enemies;
      let awakeningCutIn = prev.awakeningCutIn;
      if (newStar === 3) {
        const now = Date.now();
        nextEnemies = prev.enemies.map((e) => ({
          ...e,
          hp: e.hp - 360,
          slowUntil: Math.max(e.slowUntil, now + 2500),
        }));
        awakeningCutIn = {
          type: dst.type,
          glyph: spec.glyph,
          towerName: tierInfo.name,
          title: tierInfo.title,
          quote: tierInfo.deityQuote,
          skill: tierInfo.awakeningSkill,
        };
      }

      return {
        towers: nextTowers,
        enemies: nextEnemies,
        stones: prev.stones + rebate,
        score: prev.score + newStar * 80,
        selectedTowerId: dst.id,
        awakeningCutIn,
        tutorialStep: prev.tutorialStep === 2 ? 3 : prev.tutorialStep,
      };
    });

    return true;
  };

  findMergeablePairs() {
    const { towers } = this.state;
    const pairs = [];
    for (let i = 0; i < towers.length; i += 1) {
      for (let j = i + 1; j < towers.length; j += 1) {
        if (
          towers[i].type === towers[j].type &&
          towers[i].star === towers[j].star &&
          towers[i].star < 3
        ) {
          // Keep the first tower as destination (`dst`) so starter column formation stays intact
          pairs.push([towers[j], towers[i]]);
        }
      }
    }
    return pairs;
  }

  autoMergePair = () => {
    const pairs = this.findMergeablePairs();
    if (pairs.length === 0) return false;
    // Prefer merging 2★ -> 3★ first if available!
    pairs.sort((a, b) => b[0].star - a[0].star);
    const [src, dst] = pairs[0];
    return this.mergeTowers(src.id, dst.id);
  };

  /**
   * Active Tactical Skill for Selected Tower (車雷霆冲刺 / 炮三昧火莲定点轰炸 / 馬哮天跳斩 / 兵宝塔镇压 / 相定海神针)
   */
  triggerTowerTacticalSkill = (targetRow = null, targetCol = null, forcedTowerId = null) => {
    const { towers, selectedTowerId } = this.state;
    const activeId = forcedTowerId || selectedTowerId;
    const tower = towers.find((t) => t.id === activeId);
    if (!tower) return false;

    const now = Date.now();
    const spec = TOWER_TYPES[tower.type];
    const tierSpec = spec.tiers[tower.star] || spec.tiers[1];
    const baseSkillDmg = Math.round(spec.baseDamage * tierSpec.dmgMult * 2.4);

    playSound(SOUND.CHECK);
    hapticImpact();

    this.setState((prev) => {
      const gpLv = (prev.armory?.gunpowder || 1) - 1;
      let nextEnemies = prev.enemies.map((e) => ({ ...e }));
      let nextFireZones = [...(prev.fireZones || [])];
      let nextBeams = [...prev.fxBeams];
      let nextFloats = [...prev.floatTexts];
      let nextTowers = prev.towers.map((t) => ({ ...t }));

      if (tower.type === 'che') {
        // 🛞 車 (Armored Chariot Ram & Piercing Volley): Crushes enemies along its track ONLY (no full-screen laser!)
        const destR = targetRow !== null ? targetRow : Math.max(1, tower.row - 3);
        const destC = targetCol !== null ? targetCol : tower.col;
        const minR = Math.min(tower.row, destR) - 0.6;
        const maxR = Math.max(tower.row, destR) + 0.6;
        const minC = Math.min(tower.col, destC) - 0.6;
        const maxC = Math.max(tower.col, destC) + 0.6;

        nextEnemies.forEach((e) => {
          const hitOnTrack =
            (e.row >= minR && e.row <= maxR && Math.abs(e.col - destC) <= 0.85) ||
            (Math.abs(e.col - tower.col) <= 0.78 && e.row <= tower.row);
          if (hitOnTrack) {
            e.hp -= baseSkillDmg;
            e.row = Math.max(0.2, e.row - 0.35);
            e.slowUntil = Math.max(e.slowUntil, now + 1500);
          }
        });
        nextBeams.push({
          id: uid('fx'),
          kind: 'ram_track',
          fromCol: tower.col,
          fromRow: tower.row,
          toCol: destC,
          toRow: targetRow !== null ? destR : 0.4,
          color: '#6FA8FF',
          star: tower.star,
          expiresAt: now + 380,
        });
        nextFloats.push({
          id: uid('flt'),
          col: destC,
          row: Math.max(1, destR),
          text: `🛞战车碾压 -${baseSkillDmg}!`,
          crit: true,
          expiresAt: now + 680,
        });
      } else if (tower.type === 'pao') {
        // 🧨 炮: Launch parabolic Explosive Shell to target cell, leaving a localized burning crater!
        const lead = [...nextEnemies].sort((a, b) => b.row - a.row)[0];
        const aimRow = targetRow !== null ? targetRow : lead ? lead.row : RIVER_ROW;
        const aimCol = targetCol !== null ? targetCol : lead ? lead.col : tower.col;
        const mounted = hasCannonMount(tower, nextTowers);
        const fireDmg = Math.round(baseSkillDmg * (mounted ? 1.6 : 1.0) * (1 + gpLv * 0.28));
        const craterRadius = 1.45 * (1 + gpLv * 0.08);

        nextEnemies.forEach((e) => {
          if (Math.hypot(e.row - aimRow, e.col - aimCol) <= craterRadius + 0.3) {
            e.hp -= fireDmg;
            e.burnUntil = Math.max(e.burnUntil, now + 4000);
          }
        });
        nextFireZones.push({
          id: uid('fz'),
          row: aimRow,
          col: aimCol,
          radius: craterRadius,
          expiresAt: now + 4500,
        });
        nextBeams.push({
          id: uid('fx'),
          kind: 'arc_shell',
          fromCol: tower.col,
          fromRow: tower.row,
          toCol: aimCol,
          toRow: aimRow,
          splashR: craterRadius,
          color: '#E5594B',
          star: 3,
          expiresAt: now + 440,
        });
        nextFloats.push({
          id: uid('flt'),
          col: aimCol,
          row: aimRow,
          text: `💥定点重炮 -${fireDmg}!`,
          crit: true,
          expiresAt: now + 700,
        });
      } else {
        // 馬 / 兵 / 相: Localized weapon sweep around target cell
        const centerR = targetRow !== null ? targetRow : tower.row;
        const centerC = targetCol !== null ? targetCol : tower.col;
        nextEnemies.forEach((e) => {
          if (Math.hypot(e.row - centerR, e.col - centerC) <= 2.1) {
            e.hp -= baseSkillDmg;
            e.slowUntil = Math.max(e.slowUntil, now + 1800);
          }
        });
        nextBeams.push({
          id: uid('fx'),
          kind: 'crescent',
          fromCol: tower.col,
          fromRow: tower.row,
          toCol: centerC,
          toRow: centerR,
          color: spec.color,
          star: 3,
          expiresAt: now + 380,
        });
        nextFloats.push({
          id: uid('flt'),
          col: centerC,
          row: centerR,
          text: `⚔️破阵斩 -${baseSkillDmg}!`,
          crit: true,
          expiresAt: now + 650,
        });
      }

      const updatedTowers = nextTowers.map((t) =>
        t.id === tower.id
          ? {
              ...t,
              row:
                targetRow !== null &&
                isDeployableCell(targetRow, targetCol) &&
                tower.type !== 'pao'
                  ? targetRow
                  : t.row,
              col:
                targetCol !== null &&
                isDeployableCell(targetRow, targetCol) &&
                tower.type !== 'pao'
                  ? targetCol
                  : t.col,
              skillReadyAt: now + 4000,
            }
          : t
      );

      // Tutorial step transitions for Step 3 (車 dash) -> Step 4 (炮 fire sea) -> Step 5 (诛仙剑阵)
      let nextTutStep = prev.tutorialStep;
      let nextSelectedId = prev.selectedTowerId;
      let nextAimMode = false;
      let nextUltCharge = prev.ultCharge;

      if (prev.tutorialStep === 3 && tower.type === 'che') {
        nextTutStep = 4;
        const paoOnBoard = updatedTowers.find((t) => t.type === 'pao');
        if (paoOnBoard) {
          nextSelectedId = paoOnBoard.id;
          nextAimMode = true;
        }
      } else if (prev.tutorialStep === 4 && tower.type === 'pao') {
        nextTutStep = 5;
        nextUltCharge = 100; // fill ultimate gauge so player experiences 诛仙剑阵!
      }

      return {
        enemies: nextEnemies.filter((e) => e.hp > 0),
        fireZones: nextFireZones,
        fxBeams: nextBeams,
        floatTexts: nextFloats,
        cannonAimMode: nextAimMode,
        selectedTowerId: nextSelectedId,
        ultCharge: nextUltCharge,
        tutorialStep: nextTutStep,
        towers: updatedTowers,
      };
    });
    return true;
  };

  handleCellClick = (row, col) => {
    const { towers, selectedTowerId, cannonAimMode, tutorialStep } = this.state;
    const clickedTower = towers.find((t) => t.row === row && t.col === col);
    const selectedTower = towers.find((t) => t.id === selectedTowerId);

    // Foolproof tutorial assists for Step 3 (車 dash) & Step 4 (炮 fire sea)
    if (tutorialStep === 3 && !clickedTower && isDeployableCell(row, col)) {
      const cheTower = towers.find((t) => t.type === 'che');
      if (cheTower && (row === cheTower.row || col === cheTower.col)) {
        this.triggerTowerTacticalSkill(row, col, cheTower.id);
        return;
      }
    }
    if (tutorialStep === 4 && !clickedTower) {
      const paoTower = towers.find((t) => t.type === 'pao');
      if (paoTower) {
        this.triggerTowerTacticalSkill(row, col, paoTower.id);
        return;
      }
    }

    // If 炮 (Cannon) is in Bombard Aim Mode, clicking ANY cell launches Samadhi Fire Lotus there!
    if (selectedTower && selectedTower.type === 'pao' && cannonAimMode && !clickedTower) {
      this.triggerTowerTacticalSkill(row, col);
      return;
    }

    if (!isDeployableCell(row, col)) {
      // Clicking the River row while 炮 is selected also fires a Cannon bombardment there!
      if (selectedTower && selectedTower.type === 'pao') {
        this.triggerTowerTacticalSkill(row, col);
      }
      return;
    }

    if (clickedTower) {
      if (
        selectedTower &&
        selectedTower.id !== clickedTower.id &&
        selectedTower.type === clickedTower.type &&
        selectedTower.star === clickedTower.star &&
        clickedTower.star < 3
      ) {
        this.mergeTowers(selectedTower.id, clickedTower.id);
        return;
      }
      playSound(SOUND.SELECT);
      hapticTap();
      this.setState({
        selectedTowerId: selectedTower?.id === clickedTower.id ? null : clickedTower.id,
        cannonAimMode: false,
      });
      return;
    }

    // Clicked an empty deployable cell while a tower is selected:
    if (selectedTower) {
      // If 車 is selected and clicked along its same row or column -> ⚡ Thunder Chariot Dash Charge!
      if (
        selectedTower.type === 'che' &&
        (row === selectedTower.row || col === selectedTower.col)
      ) {
        this.triggerTowerTacticalSkill(row, col);
        return;
      }
      // If 馬 is selected and clicked on a "日"-jump square -> 🐎 Knight Jump-Slash!
      if (
        selectedTower.type === 'ma' &&
        isKnightJump(selectedTower.row, selectedTower.col, row, col)
      ) {
        this.triggerTowerTacticalSkill(row, col);
        return;
      }

      // Otherwise reposition the tower and fire a move sound
      playSound(SOUND.MOVE);
      hapticTap();
      this.setState((prev) => ({
        towers: prev.towers.map((t) =>
          t.id === selectedTower.id ? { ...t, row, col } : t
        ),
      }));
    }
  };

  getArmoryCost(trackId) {
    const def = ARMORY_UPGRADES[trackId];
    const lv = this.state.armory?.[trackId] || 1;
    return def.baseCost + (lv - 1) * def.costStep;
  }

  upgradeArmory = (trackId) => {
    const def = ARMORY_UPGRADES[trackId];
    if (!def) return false;
    const cost = this.getArmoryCost(trackId);
    if (this.state.stones < cost) return false;

    playSound(SOUND.CAPTURE);
    hapticImpact();
    const now = Date.now();

    this.setState((prev) => {
      const nextLv = (prev.armory?.[trackId] || 1) + 1;
      const healGate = trackId === 'barricade' ? 4 : 0;
      return {
        stones: prev.stones - cost,
        armory: {
          ...prev.armory,
          [trackId]: nextLv,
        },
        maxCoreHp: prev.maxCoreHp + healGate,
        coreHp: Math.min(prev.maxCoreHp + healGate, prev.coreHp + healGate),
        floatTexts: [
          ...prev.floatTexts,
          {
            id: uid('flt'),
            col: CORE_POS.col,
            row: 5.5,
            text: `${def.icon}${def.name} 升至 Lv.${nextLv}!`,
            crit: true,
            expiresAt: now + 900,
          },
        ],
      };
    });
    return true;
  };

  claimMeritSkill = () => {
    const { pendingSkills, activeDecrees } = this.state;
    if (!pendingSkills || pendingSkills <= 0) return false;
    playSound(SOUND.PLACE);
    hapticTap();

    const available = CELESTIAL_DECREES.filter((d) => !activeDecrees.includes(d.id));
    const pool = available.length >= 3 ? available : CELESTIAL_DECREES;
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);

    this.setState((prev) => ({
      pendingSkills: Math.max(0, prev.pendingSkills - 1),
      decreeChoices: shuffled,
      decreeSource: 'merit',
    }));
    return true;
  };

  castUltimate = () => {
    const { ultCharge, enemies } = this.state;
    if (ultCharge < 100) return false;
    playSound(SOUND.CHECK);
    hapticNotification('success');

    const now = Date.now();
    const gpLv = (this.state.armory?.gunpowder || 1) - 1;
    const ultMult = (this.hasDecree('lingxiao_jianzhen') ? 1.8 : 1.0) * (1 + gpLv * 0.25);
    const dmg = Math.round(320 * ultMult);

    if (this.state.tutorialStep === 5) {
      markTutorialCompletedStorage();
    }

    this.setState((prev) => {
      const finishingTutorial = prev.tutorialStep === 5;
      const updatedEnemies = prev.enemies
        .map((e) => ({
          ...e,
          hp: e.hp - dmg,
          slowUntil: Math.max(e.slowUntil, now + 1800),
        }))
        .filter((e) => !finishingTutorial || e.hp > 0);

      // Launch 5 real parabolic siege cannonballs from the bottom fortress wall!
      const volleyArcs = [1, 2, 3, 4, 5].map((c) => ({
        id: uid('fx'),
        kind: 'arc_shell',
        fromCol: CORE_POS.col,
        fromRow: CORE_POS.row,
        toCol: c,
        toRow: 2.2 + (c % 2) * 1.1,
        splashR: 1.1,
        color: '#F59E0B',
        star: 3,
        expiresAt: now + 450,
      }));

      return {
        tutorialStep: finishingTutorial ? null : prev.tutorialStep,
        ultCharge: this.hasDecree('lingxiao_jianzhen') ? 25 : 0,
        enemies: updatedEnemies,
        fxBeams: [...prev.fxBeams, ...volleyArcs],
        floatTexts: [
          ...prev.floatTexts,
          ...enemies.slice(0, 6).map((e) => ({
            id: uid('flt'),
            col: e.col,
            row: e.row,
            text: `💥城炮齐射 -${dmg}!`,
            crit: true,
            expiresAt: now + 650,
          })),
          ...(finishingTutorial
            ? [
                {
                  id: uid('flt'),
                  col: CORE_POS.col,
                  row: 3.5,
                  text: '🎉 操练圆满！第一波敌军正式攻城！',
                  crit: true,
                  expiresAt: now + 1400,
                },
              ]
            : []),
        ],
      };
    });
    return true;
  };

  startInteractiveTutorial = () => {
    playSound(SOUND.SELECT);
    this.setState(this.createInitialState({ forceTutorial: true }));
  };

  skipTutorial = () => {
    markTutorialCompletedStorage();
    playSound(SOUND.SELECT);
    this.setState({
      tutorialStep: null,
      cannonAimMode: false,
    });
  };

  chooseDecree = (decree) => {
    if (!decree) return;
    playSound(SOUND.PLACE);
    hapticImpact();

    this.setState((prev) => {
      const isMeritSkill = prev.decreeSource === 'merit';
      const nextWaveIdx = isMeritSkill ? prev.waveIndex : prev.waveIndex + 1;
      const nextDecrees = prev.activeDecrees.includes(decree.id)
        ? prev.activeDecrees
        : [...prev.activeDecrees, decree.id];
      const bonusStones = decree.id === 'sadou_chengbing' ? 90 : 0;
      const bonusHp = decree.id === 'pantao_shenghui' ? 6 : 0;

      return {
        activeDecrees: nextDecrees,
        decreeChoices: null,
        decreeSource: null,
        waveIndex: nextWaveIdx,
        spawnQueue: isMeritSkill ? prev.spawnQueue : this.buildWaveSpawnQueue(nextWaveIdx),
        spawnCooldownMs: isMeritSkill ? prev.spawnCooldownMs : 500,
        stones: prev.stones + bonusStones,
        maxCoreHp: prev.maxCoreHp + bonusHp,
        coreHp: Math.min(prev.maxCoreHp + bonusHp, prev.coreHp + bonusHp),
      };
    });
  };

  cycleSpeed = () => {
    this.setState((prev) => ({
      speedMultiplier: prev.speedMultiplier === 1 ? 2 : prev.speedMultiplier === 2 ? 3 : 1,
    }));
  };

  restartGame = () => {
    playSound(SOUND.SELECT);
    this.setState(this.createInitialState());
  };

  // ── Render ─────────────────────────────────────────────────────

  render() {
    const {
      boardWidth,
      tiltEnabled,
      speedMultiplier,
      isPaused,
      tutorialStep,
      showGuideModal,
      cannonAimMode,
      waveIndex,
      stones,
      coreHp,
      maxCoreHp,
      score,
      kills,
      pendingSkills,
      armory,
      ultCharge,
      towers,
      selectedTowerId,
      enemies,
      fireZones,
      fxBeams,
      floatTexts,
      activeDecrees,
      decreeChoices,
      awakeningCutIn,
      bgVideoOk,
      awakeningVideoOk,
      gameResult,
    } = this.state;

    const currentWave = WAVES[waveIndex] || WAVES[0];
    const cellSize = Math.floor(boardWidth / GRID_COLS);
    const exactWidth = cellSize * GRID_COLS;
    const exactHeight = cellSize * GRID_ROWS;
    const tiltDeg = tiltEnabled ? boardTiltDegrees(exactWidth) : 0;

    const summonCost = this.getSummonCost();
    const mergePairs = this.findMergeablePairs();
    const selectedTower = towers.find((t) => t.id === selectedTowerId) || null;
    const selectedSpec = selectedTower ? TOWER_TYPES[selectedTower.type] : null;
    const selectedTier = selectedTower ? selectedSpec.tiers[selectedTower.star] : null;
    const selectedMounted = selectedTower ? hasCannonMount(selectedTower, towers) : false;

    const killsIntoSkill = kills % KILLS_PER_SKILL;
    const skillProgressPct = Math.round((killsIntoSkill / KILLS_PER_SKILL) * 100);
    const gpCost = this.getArmoryCost('gunpowder');
    const mechCost = this.getArmoryCost('mechanism');
    const barCost = this.getArmoryCost('barricade');

    // Contextual dynamic step-by-step coach tip
    let stepTip = '💡 点击场上的实体军械查看射界与规则，下方【铁匠军械坊】可随时花银两升级武器！';
    if (pendingSkills > 0) {
      stepTip = `🎖️ 杀敌军功已满！点击上方金色【🎁 领新技能 (+${pendingSkills})】免费选择一项军械改装！`;
    } else if (stones >= summonCost && towers.length <= 3) {
      stepTip = `👆 当前有 💰${stones}两军饷！点下方红色【招募器械】补充战车、火炮或重盾！`;
    } else if (mergePairs.length > 0) {
      stepTip = `✨ 场上有 ${mergePairs.length} 对同型同星器械！点绿色【一键合阵】合体改装升星！`;
    } else if (selectedTower?.type === 'che') {
      stepTip = '🛞 已选【車·床弩战车】：只沿本列正前方发射实体破甲箭（穿透3敌）！点蓝色车辙格可直线冲撞！';
    } else if (selectedTower?.type === 'pao') {
      stepTip = selectedMounted
        ? '🧨 已选【炮·红衣火炮】（同列前排有炮架 → 已激活2倍隔山开花炸弹！）：点【🎯定点炮击】可指哪炸哪！'
        : '🧨 已选【炮·红衣火炮】（当前无炮架：仅平射单发铁弹）：在它同列正前方摆一尊盾/车做炮架，即可翻山轰出2倍开花炸弹！';
    } else if (selectedTower?.type === 'ma') {
      stepTip = '🐎 已选【馬·斩马铁骑】：近身挥砍高暴击！点击发光的象棋“日”字格可跃马跳劈！';
    }

    return (
      <div className="tiangong-td-page" data-testid="tiangong-td">
        {/* Ambient Celestial Cloud Sea + Optional Drop-in AI Loop Video */}
        <div className="tg-ambient-bg" aria-hidden="true">
          {bgVideoOk && (
            <video
              className="tg-bg-video"
              src={AI_VISUAL_SLOTS.backgroundLoopVideo}
              ref={(el) => { if (el) el.muted = true; }}
              autoPlay
              loop
              playsInline
              onError={() => this.setState({ bgVideoOk: false })}
            />
          )}
          <div className="tg-cloud-layer" />
        </div>

        <div className="tg-shell">
          {/* Top HUD */}
          <div className="tg-hud">
            <div className="tg-hud-top">
              <div className="tg-title-wrap">
                <span className="tg-seal-badge">天</span>
                <div>
                  <div className="tg-wave-title">{currentWave.title}</div>
                  <div className="tg-wave-sub">
                    波次 {waveIndex + 1}/{WAVES.length} · 拖拽或点选同名棋子合阵化神
                  </div>
                </div>
              </div>
              <div className="tg-hud-controls">
                <button
                  type="button"
                  className="tg-mini-btn guide-btn"
                  data-testid="tg-start-tutorial-btn"
                  onClick={this.startInteractiveTutorial}
                >
                  👆 新手引导
                </button>
                <button
                  type="button"
                  className="tg-mini-btn"
                  data-testid="tg-guide-btn"
                  onClick={() => this.setState({ showGuideModal: true })}
                >
                  📖 兵法
                </button>
                <button
                  type="button"
                  className={`tg-mini-btn ${speedMultiplier > 1 ? 'active' : ''}`}
                  onClick={this.cycleSpeed}
                  aria-label="切换战斗倍速"
                >
                  {speedMultiplier}x
                </button>
                <button
                  type="button"
                  className={`tg-mini-btn ${tiltEnabled ? 'active' : ''}`}
                  onClick={() => this.setState({ tiltEnabled: !tiltEnabled })}
                  aria-label="切换2.5D星盘视角"
                >
                  {tiltEnabled ? '2.5D' : '2D'}
                </button>
                <button
                  type="button"
                  className={`tg-mini-btn ${isPaused ? 'active' : ''}`}
                  onClick={() => this.setState({ isPaused: !isPaused })}
                  aria-label={isPaused ? '继续战斗' : '暂停战斗'}
                >
                  {isPaused ? '继续' : '暂停'}
                </button>
              </div>
            </div>

            <div className="tg-hud-stats">
              <div className="tg-stat-pill">
                <span className="tg-stat-label">战利银两 (买兵/加点)</span>
                <span className="tg-stat-val gold" data-testid="tg-stones">
                  💰 {stones}两
                </span>
              </div>
              <div className="tg-stat-pill">
                <span className="tg-stat-label">南天门城防</span>
                <span
                  className={`tg-stat-val hp ${coreHp <= 6 ? 'low' : ''}`}
                  data-testid="tg-core-hp"
                >
                  ♥ {coreHp}/{maxCoreHp}
                </span>
              </div>
              <div className="tg-stat-pill">
                <span className="tg-stat-label">阵上器械</span>
                <span className="tg-stat-val" data-testid="tg-tower-count">
                  {towers.length} 尊
                </span>
              </div>
              <div className="tg-stat-pill">
                <span className="tg-stat-label">累计歼敌</span>
                <span className="tg-stat-val" data-testid="tg-kill-count">
                  ⚔️ {kills} 敌
                </span>
              </div>
            </div>

            {/* Kill Loot & Skill Merit Progress Bar (明示杀敌奖励与加技能条件) */}
            <div className="tg-kill-reward-bar" data-testid="tg-kill-reward-bar">
              <div className="tg-krb-left">
                <span className="tg-krb-rule">
                  战利规则：每灭1敌掉 <strong>💰+{currentWave.reward}两银</strong> · 每满{' '}
                  <strong>{KILLS_PER_SKILL}杀</strong> 免费升1项技能
                </span>
                <div className="tg-krb-track">
                  <div
                    className="tg-krb-fill"
                    style={{ width: `${pendingSkills > 0 ? 100 : skillProgressPct}%` }}
                  />
                </div>
              </div>

              {pendingSkills > 0 ? (
                <button
                  type="button"
                  className="tg-claim-skill-btn"
                  data-testid="tg-claim-skill-btn"
                  onClick={this.claimMeritSkill}
                >
                  🎁 领新技能 (+{pendingSkills})
                </button>
              ) : (
                <span className="tg-krb-counter">
                  🎖️ {killsIntoSkill}/{KILLS_PER_SKILL}杀领技能
                </span>
              )}
            </div>
          </div>

          {/* Interactive 5-Step Taibai Jinxing Onboarding Card OR Live Coach Bar */}
          {tutorialStep && TUTORIAL_STEPS[tutorialStep] ? (
            <div className="tg-tutorial-card" data-testid="tg-tutorial-card">
              <MentorChibi size={48} />
              <div className="tg-tut-body">
                <div className="tg-tut-header">
                  <span className="tg-tut-step-badge">
                    <span>✦ 太白金星传功 · {TUTORIAL_STEPS[tutorialStep].title}</span>
                    <span className="tg-tut-dots" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className={`tg-tut-dot ${
                            s < tutorialStep ? 'done' : s === tutorialStep ? 'current' : ''
                          }`}
                        />
                      ))}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="tg-tut-skip"
                    data-testid="tg-skip-tutorial-btn"
                    onClick={this.skipTutorial}
                  >
                    跳过引导 ×
                  </button>
                </div>
                <div className="tg-tut-text">{TUTORIAL_STEPS[tutorialStep].body}</div>
              </div>
            </div>
          ) : (
            <div className="tg-step-guide-bar" data-testid="tg-step-guide">
              <span>{stepTip}</span>
            </div>
          )}

          {/* Active Celestial Decrees Strip */}
          {activeDecrees.length > 0 && (
            <div className="tg-decrees-strip" aria-label="已激活天道法旨">
              {activeDecrees.map((id) => {
                const d = CELESTIAL_DECREES.find((item) => item.id === id);
                return d ? (
                  <span key={id} className="tg-decree-chip" title={d.desc}>
                    {d.name}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* 2.5D Celestial Star-Board */}
          <TiltStage width={exactWidth + 20} tilt={tiltDeg} className="tg-tilt-stage">
            <div className="tg-board-frame" style={{ width: exactWidth + 20 }}>
              <div
                className="tg-board-canvas"
                style={{ width: exactWidth, height: exactHeight }}
              >
                <div className="tg-rift-banner">
                  ▲ 九幽魔界裂隙 · 妖潮剩余 {this.state.spawnQueue.length + enemies.length}
                </div>

                {/* Celestial River (Row 3) */}
                <div
                  className="tg-river-banner"
                  style={{
                    top: RIVER_ROW * cellSize,
                    height: cellSize,
                  }}
                >
                  <span>天河弱水</span>
                  <span>星汉定界</span>
                </div>

                {/* Star Grid */}
                <div
                  className="tg-grid"
                  style={{
                    gridTemplateColumns: `repeat(${GRID_COLS}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${GRID_ROWS}, ${cellSize}px)`,
                  }}
                >
                  {Array.from({ length: GRID_ROWS }).map((_, r) =>
                    Array.from({ length: GRID_COLS }).map((__, c) => {
                      const isCore = r === CORE_POS.row && c === CORE_POS.col;
                      const deployable = isDeployableCell(r, c);
                      const tower = towers.find((t) => t.row === r && t.col === c);
                      const isSelected = tower && tower.id === selectedTowerId;
                      const isMergeCandidate =
                        tower &&
                        selectedTower &&
                        tower.id !== selectedTower.id &&
                        tower.type === selectedTower.type &&
                        tower.star === selectedTower.star &&
                        tower.star < 3;

                      // Visual attack / move highlights when 車, 馬, or 炮 is selected
                      const isCheRail =
                        selectedTower &&
                        selectedTower.type === 'che' &&
                        (r === selectedTower.row || c === selectedTower.col) &&
                        !(r === selectedTower.row && c === selectedTower.col);

                      const isMaJump =
                        selectedTower &&
                        selectedTower.type === 'ma' &&
                        deployable &&
                        !tower &&
                        isKnightJump(selectedTower.row, selectedTower.col, r, c);

                      const isPaoLane =
                        selectedTower &&
                        selectedTower.type === 'pao' &&
                        c === selectedTower.col &&
                        r < selectedTower.row;

                      const isMountForSelectedPao =
                        tower &&
                        selectedTower &&
                        selectedTower.type === 'pao' &&
                        tower.id !== selectedTower.id &&
                        tower.col === selectedTower.col &&
                        tower.row < selectedTower.row;

                      const isPaoAim =
                        selectedTower &&
                        selectedTower.type === 'pao' &&
                        cannonAimMode &&
                        !tower;

                      const activeFireHere = (fireZones || []).some(
                        (fz) => Math.hypot(r - fz.row, c - fz.col) <= 0.85
                      );

                      const paoMounted = tower ? hasCannonMount(tower, towers) : false;

                      // Spotlight target cell during Tutorial Steps 3 (車 dash) & 4 (炮 fire sea)
                      const isTutStep3Target = tutorialStep === 3 && r === 2 && c === 3;
                      const isTutStep4Target = tutorialStep === 4 && r === 3 && c === 3;
                      const isTutCellTarget = isTutStep3Target || isTutStep4Target;

                      return (
                        <div
                          key={`${r}-${c}`}
                          data-testid={`tg-cell-${r}-${c}`}
                          className={[
                            'tg-cell',
                            deployable ? 'deployable' : '',
                            isSelected ? 'selected' : '',
                            isMergeCandidate ? 'merge-hint' : '',
                            isCheRail ? 'rail-highlight' : '',
                            isPaoLane ? 'pao-lane-highlight' : '',
                            isMaJump ? 'knight-highlight' : '',
                            isPaoAim ? 'pao-aim-highlight' : '',
                            activeFireHere ? 'burning-cell' : '',
                            isTutCellTarget ? 'tg-tut-target' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => this.handleCellClick(r, c)}
                        >
                          {isTutCellTarget && (
                            <span className="tg-finger-pointer">
                              {TUTORIAL_STEPS[tutorialStep].pointerText}
                            </span>
                          )}
                          {isMountForSelectedPao && (
                            <span className="tg-mount-spotter-badge">🎯炮架</span>
                          )}
                          {isCore && (
                            <div className="tg-core-fortress" title="南天门 · 凌霄宝殿">
                              <span className="tg-core-glyph">帥</span>
                              <span className="tg-core-sub">南天门</span>
                            </div>
                          )}

                          {activeFireHere && !tower && !isCore && (
                            <span className="tg-fire-zone-badge" aria-hidden="true">
                              🔥火海
                            </span>
                          )}

                          {tower && (
                            <DeityChibi
                              type={tower.type}
                              star={tower.star}
                              size={Math.max(38, Math.floor(cellSize * 0.88))}
                              hasMountBuff={paoMounted}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Enemies Layer (Q-version Demon Chibis) */}
                <div className="tg-enemies-layer">
                  {enemies.map((enemy) => {
                    const leftPx = (enemy.col + 0.5) * cellSize;
                    const topPx = (enemy.row + 0.5) * cellSize;
                    const hpPct = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));
                    return (
                      <div
                        key={enemy.id}
                        className={[
                          'tg-enemy',
                          enemy.isBoss ? 'is-boss' : '',
                          enemy.slowUntil > Date.now() ? 'slowed' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        style={{ left: leftPx, top: topPx }}
                      >
                        <div className="tg-enemy-hp-bar">
                          <div
                            className="tg-enemy-hp-fill"
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>
                        <DemonChibi glyph={enemy.glyph} isBoss={enemy.isBoss} />
                      </div>
                    );
                  })}
                </div>

                {/* SVG Physical Ballistics & Projectiles (No Full-Screen Lasers!) */}
                <svg
                  className="tg-fx-svg"
                  viewBox={`0 0 ${exactWidth} ${exactHeight}`}
                >
                  {fxBeams.map((fx) => {
                    const x1 = (fx.fromCol + 0.5) * cellSize;
                    const y1 = (fx.fromRow + 0.5) * cellSize;
                    const x2 = (fx.toCol + 0.5) * cellSize;
                    const y2 = (fx.toRow + 0.5) * cellSize;

                    if (fx.kind === 'arc_shell') {
                      // Parabolic high-arcing Explosive Cannon Shell arching over front-line mount!
                      const ctrlX = (x1 + x2) / 2 + cellSize * 0.48;
                      const ctrlY = Math.min(y1, y2) - cellSize * 0.9;
                      const craterPx = cellSize * Math.min(1.35, (fx.splashR || 1.1) * 0.55);
                      return (
                        <g key={fx.id}>
                          {/* Ground shadow line */}
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="rgba(0,0,0,0.35)"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                          />
                          {/* High parabolic cannonball trajectory */}
                          <path
                            d={`M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`}
                            fill="none"
                            stroke="#FACC15"
                            strokeWidth="2.5"
                            strokeDasharray="5 3"
                          />
                          {/* Explosive impact crater */}
                          <circle
                            cx={x2}
                            cy={y2}
                            r={craterPx}
                            fill="rgba(239, 68, 68, 0.34)"
                            stroke="#F97316"
                            strokeWidth="2.2"
                          />
                          {/* Iron Cannon Shell */}
                          <circle
                            cx={x2}
                            cy={y2}
                            r="6.5"
                            fill="#1E293B"
                            stroke="#FDE047"
                            strokeWidth="2"
                          />
                        </g>
                      );
                    }

                    if (fx.kind === 'solid_ball') {
                      // Unmounted flat-trajectory solid iron cannonball
                      return (
                        <g key={fx.id}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#CBD5E1"
                            strokeWidth="2.2"
                          />
                          <circle cx={x1} cy={y1 - 6} r="6" fill="rgba(226,232,240,0.45)" />
                          <circle
                            cx={x2}
                            cy={y2}
                            r="5.2"
                            fill="#0F172A"
                            stroke="#E2E8F0"
                            strokeWidth="1.5"
                          />
                        </g>
                      );
                    }

                    if (fx.kind === 'bolt') {
                      // Heavy Ballista Armor-Piercing Bolt along its single column
                      return (
                        <g key={fx.id}>
                          <line
                            x1={x1}
                            y1={y1 - 8}
                            x2={x2}
                            y2={y2}
                            stroke="#93C5FD"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                          />
                          {/* Steel Arrowhead at target */}
                          <polygon
                            points={`${x2},${y2 - 6} ${x2 - 5},${y2 + 5} ${x2 + 5},${y2 + 5}`}
                            fill="#F8FAFC"
                            stroke="#0284C7"
                            strokeWidth="1.2"
                          />
                        </g>
                      );
                    }

                    if (fx.kind === 'ram_track') {
                      // Twin parallel chariot wheel tracks along the rammed path
                      return (
                        <g key={fx.id}>
                          <line
                            x1={x1 - 7}
                            y1={y1}
                            x2={x2 - 7}
                            y2={y2}
                            stroke="#FACC15"
                            strokeWidth="3"
                            strokeDasharray="6 3"
                          />
                          <line
                            x1={x1 + 7}
                            y1={y1}
                            x2={x2 + 7}
                            y2={y2}
                            stroke="#FACC15"
                            strokeWidth="3"
                            strokeDasharray="6 3"
                          />
                        </g>
                      );
                    }

                    if (fx.kind === 'crescent') {
                      // Cavalry Guan-Dao blade arc right on target
                      return (
                        <path
                          key={fx.id}
                          d={`M ${x2 - 16} ${y2 + 8} Q ${x2} ${y2 - 18} ${x2 + 16} ${y2 + 8}`}
                          fill="none"
                          stroke="#FEF08A"
                          strokeWidth="3.6"
                          strokeLinecap="round"
                        />
                      );
                    }

                    // Pike thrust or Watchtower feathered arrow
                    return (
                      <g key={fx.id}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={fx.color}
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                        <circle cx={x2} cy={y2} r="3" fill="#FFFBEB" />
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Damage Numbers */}
                <div className="tg-float-texts">
                  {floatTexts.map((flt) => (
                    <div
                      key={flt.id}
                      className={`tg-float-dmg ${flt.crit ? 'crit' : ''}`}
                      style={{
                        left: (flt.col + 0.5) * cellSize,
                        top: (flt.row + 0.35) * cellSize,
                      }}
                    >
                      {flt.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TiltStage>

          {/* Bottom Command Dock (iOS Thumb Zone) */}
          <div className="tg-dock">
            <div className="tg-dock-actions">
              <button
                type="button"
                className={[
                  'tg-action-btn summon',
                  stones >= summonCost && towers.length <= 4 ? 'pulse-cta' : '',
                  tutorialStep === 1 ? 'tg-tut-target' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-testid="tg-summon-btn"
                disabled={stones < summonCost}
                onClick={this.summonTower}
              >
                {tutorialStep === 1 && (
                  <span className="tg-finger-pointer">
                    {TUTORIAL_STEPS[1].pointerText}
                  </span>
                )}
                <span className="tg-btn-main">
                  <Icon name="sparkles" size={15} /> 招募器械
                </span>
                <span className="tg-btn-sub">花费 💰{summonCost}两</span>
              </button>

              <button
                type="button"
                className={[
                  'tg-action-btn merge',
                  mergePairs.length > 0 ? 'pulse-merge' : '',
                  tutorialStep === 2 ? 'tg-tut-target' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-testid="tg-merge-btn"
                disabled={mergePairs.length === 0}
                onClick={this.autoMergePair}
              >
                {tutorialStep === 2 && (
                  <span className="tg-finger-pointer">
                    {TUTORIAL_STEPS[2].pointerText}
                  </span>
                )}
                <span className="tg-btn-main">
                  <Icon name="zap" size={15} /> 一键合阵 ({mergePairs.length})
                </span>
                <span className="tg-btn-sub">同型升星 · 3★重器</span>
              </button>

              <button
                type="button"
                className={[
                  'tg-action-btn ult',
                  ultCharge >= 100 ? 'ready' : '',
                  tutorialStep === 5 ? 'tg-tut-target' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-testid="tg-ult-btn"
                disabled={ultCharge < 100}
                onClick={this.castUltimate}
              >
                {tutorialStep === 5 && (
                  <span className="tg-finger-pointer">
                    {TUTORIAL_STEPS[5].pointerText}
                  </span>
                )}
                <span className="tg-btn-main">
                  <Icon name="crown" size={15} /> 城炮齐射
                </span>
                <span className="tg-btn-sub">
                  {ultCharge >= 100 ? '火药满仓·点击齐射!' : `火药装填 ${Math.floor(ultCharge)}%`}
                </span>
              </button>
            </div>

            {/* Direct Silver-Coin Weapon Skill Upgrades (铁匠军械坊 · 随时花银两加技能) */}
            <div className="tg-armory-strip" data-testid="tg-armory-strip">
              <div className="tg-armory-header">
                <span>🔨 铁匠军械坊（用杀敌掉落的 💰白银 直接给武器加点升级）：</span>
              </div>
              <div className="tg-armory-btns">
                <button
                  type="button"
                  className="tg-armory-btn"
                  data-testid="tg-upg-gunpowder"
                  disabled={stones < gpCost}
                  onClick={() => this.upgradeArmory('gunpowder')}
                >
                  <span className="tg-arm-title">🧨 火药扩容 Lv.{armory.gunpowder}</span>
                  <span className="tg-arm-sub">炮伤+28% · 💰{gpCost}两</span>
                </button>
                <button
                  type="button"
                  className="tg-armory-btn"
                  data-testid="tg-upg-mechanism"
                  disabled={stones < mechCost}
                  onClick={() => this.upgradeArmory('mechanism')}
                >
                  <span className="tg-arm-title">⚙️ 精钢机括 Lv.{armory.mechanism}</span>
                  <span className="tg-arm-sub">装填+18% · 💰{mechCost}两</span>
                </button>
                <button
                  type="button"
                  className="tg-armory-btn"
                  data-testid="tg-upg-barricade"
                  disabled={stones < barCost}
                  onClick={() => this.upgradeArmory('barricade')}
                >
                  <span className="tg-arm-title">🛡️ 铁壁拒马 Lv.{armory.barricade}</span>
                  <span className="tg-arm-sub">城门+4血 · 💰{barCost}两</span>
                </button>
              </div>
            </div>

            {/* Selected Tower Tactical Bar */}
            <div className="tg-inspector">
              {selectedTower ? (
                <>
                  <div className="tg-inspector-info">
                    <span className="tg-inspector-name">
                      【{selectedSpec.glyph} · {'★'.repeat(selectedTower.star)}】{selectedTier.name}
                      {selectedTower.type === 'pao' &&
                        (selectedMounted
                          ? ' 🎯【同列有炮架 · 仰射2倍开花炸弹】'
                          : ' ⚫【前排无炮架 · 当前仅平射单发铁弹】')}
                    </span>
                    <span className="tg-inspector-desc">
                      {selectedTower.type === 'che' &&
                        '规则：只向本列正前方发射破甲重箭（穿透3敌）！点发光车辙格可直线冲撞碾压'}
                      {selectedTower.type === 'pao' &&
                        '规则：把【兵/車】摆在同一列正前方当炮架，炮口就会翻山抛射2倍开花炸弹！点右侧可定点炮击'}
                      {selectedTower.type === 'ma' &&
                        '规则：周身挥砍斩马长刀！点击发光“日”字格可跃马跳劈'}
                      {(selectedTower.type === 'bing' || selectedTower.type === 'xiang') &&
                        `${selectedSpec.role} · ${selectedSpec.patternLabel}`}
                    </span>
                  </div>

                  <div className="tg-inspector-btns">
                    {selectedTower.type === 'pao' ? (
                      <button
                        type="button"
                        data-testid="tg-pao-bombard-btn"
                        className="tg-mini-btn active"
                        onClick={() => {
                          if (cannonAimMode) {
                            this.triggerTowerTacticalSkill();
                          } else {
                            this.setState({ cannonAimMode: true });
                          }
                        }}
                      >
                        {cannonAimMode ? '💥 立即开炮!' : '🎯 定点炮击'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-testid="tg-tactical-skill-btn"
                        className="tg-mini-btn active"
                        onClick={() => this.triggerTowerTacticalSkill()}
                      >
                        {selectedTower.type === 'che' ? '🛞 战车冲撞' : '⚔️ 战技突击'}
                      </button>
                    )}

                    {selectedTower.star === 3 && (
                      <button
                        type="button"
                        className="tg-mini-btn active"
                        onClick={() =>
                          this.setState({
                            awakeningCutIn: {
                              type: selectedTower.type,
                              glyph: selectedSpec.glyph,
                              towerName: selectedTier.name,
                              title: selectedTier.title,
                              quote: selectedTier.deityQuote,
                              skill: selectedTier.awakeningSkill,
                            },
                          })
                        }
                      >
                        法相真身
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="tg-inspector-info">
                  <span className="tg-inspector-name">天宫星盘操作指南（点击棋盘上的 Q版神将 即可操控）</span>
                  <span className="tg-inspector-desc">
                    ① 点【敕令募兵】招神将 → ② 点【一键合阵】合成3★真神 → ③ 点选【車/炮/馬】释放专属象棋神技！
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How-To-Play Modal (車/炮怎么玩 图文教学) */}
        {showGuideModal && (
          <div
            className="tg-modal-backdrop"
            data-testid="tg-guide-modal"
            onClick={() => this.setState({ showGuideModal: false })}
          >
            <div
              className="tg-decree-modal tg-codex-box"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tg-modal-kicker">✦ 真实军械规则 · 一眼看懂 ✦</div>
              <h2 className="tg-modal-title">【炮】怎么架？杀敌得什么？怎么加技能？</h2>

              <div className="tg-codex-list">
                <div className="tg-codex-item">
                  <DeityChibi type="pao" star={2} size={48} hasMountBuff />
                  <div className="tg-codex-meta">
                    <div className="tg-codex-name">
                      <span className="tg-codex-t3">🧨【炮 · 红衣火炮】真实象棋“隔山打牛”规则</span>
                    </div>
                    <div className="tg-codex-ult">
                      • <strong>无炮架（平射实心铁弹）</strong>：正前方同列没有己方器械时，只平射黑色铁弹撞击最前排1名敌人。<br />
                      • <strong>有炮架（仰射2倍开花炸弹）</strong>：在同一列正前方摆一尊【兵·铁盾】或【車·战车】当<strong>炮架</strong>，火炮自动抬高仰角，翻山抛射<strong>2倍伤害开花榴弹</strong>炸平一片！
                    </div>
                  </div>
                </div>

                <div className="tg-codex-item">
                  <DeityChibi type="che" star={2} size={48} />
                  <div className="tg-codex-meta">
                    <div className="tg-codex-name">
                      <span className="tg-codex-t3">🛞【車 · 床弩战车】与【兵 · 铁盾拒马】</span>
                    </div>
                    <div className="tg-codex-ult">
                      • <strong>【車】纵向破甲重箭</strong>：只沿<strong>本列正前方</strong>发射实体重箭连续穿透3名敌人；点蓝色车辙格可直线碾压冲撞。<br />
                      • <strong>【兵】重盾堵路</strong>：物理挡住本列敌兵脚步（减速85%）并用长枪突刺，是给后排火炮当【炮架】的绝配！
                    </div>
                  </div>
                </div>

                <div className="tg-codex-item">
                  <DeityChibi type="xiang" star={2} size={48} />
                  <div className="tg-codex-meta">
                    <div className="tg-codex-name">
                      <span className="tg-codex-t3">💰 消灭多少人得什么？怎么加技能？</span>
                    </div>
                    <div className="tg-codex-ult">
                      • <strong>每消灭 1 名敌兵</strong>：立即掉落 <strong>💰14~28两白银</strong> + <strong>10%城炮火药</strong>。<br />
                      • <strong>加技能方法 ①（随时加点）</strong>：在屏幕下方<strong>【🔨铁匠军械坊】</strong>直接花白银升级【火药扩容 / 精钢机括 / 铁壁拒马】。<br />
                      • <strong>加技能方法 ②（杀敌授勋）</strong>：每累计消灭 <strong>8 名敌兵</strong>（以及每守住1波），上方亮起<strong>【🎁领新技能】</strong>，免费三选一改装全军器械！
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  className="tg-primary-cta"
                  onClick={this.startInteractiveTutorial}
                >
                  👆 开启 5 步手把手实战引导（推荐）
                </button>
                <button
                  type="button"
                  className="tg-mini-btn"
                  style={{ width: '100%', justifyContent: 'center', minHeight: 38 }}
                  onClick={() => this.setState({ showGuideModal: false })}
                >
                  关闭窗口 · 继续当前战局
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 3-Star "法天象地" Colossal Deity Awakening Cut-in Modal */}
        {awakeningCutIn && (
          <div className="tg-modal-backdrop" data-testid="tg-awakening-modal">
            <div className="tg-awakening-modal">
              <div className="tg-modal-kicker">✦ 三星化神 · 法天象地降临 ✦</div>
              <h2 className="tg-modal-title">{awakeningCutIn.towerName}</h2>
              <div className="tg-modal-subtitle">{awakeningCutIn.title}</div>

              {awakeningVideoOk[awakeningCutIn.type] !== false && (
                <video
                  className="tg-awakening-video"
                  src={AI_VISUAL_SLOTS.awakeningVideos[awakeningCutIn.type]}
                  ref={(el) => { if (el) el.muted = true; }}
                  autoPlay
                  playsInline
                  onError={() =>
                    this.setState((prev) => ({
                      awakeningVideoOk: {
                        ...prev.awakeningVideoOk,
                        [awakeningCutIn.type]: false,
                      },
                    }))
                  }
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                <DeityChibi type={awakeningCutIn.type} star={3} size={92} />
              </div>
              <div className="tg-awakening-quote">“{awakeningCutIn.quote}”</div>
              <div className="tg-awakening-skill">
                <strong>神通觉醒：</strong>
                {awakeningCutIn.skill}
              </div>

              <button
                type="button"
                className="tg-primary-cta"
                onClick={() => this.setState({ awakeningCutIn: null })}
              >
                领旨镇魔 · 继续守城
              </button>
            </div>
          </div>
        )}

        {/* Roguelike 3-Choice Celestial Decree Modal */}
        {decreeChoices && (
          <div className="tg-modal-backdrop" data-testid="tg-decree-modal">
            <div className="tg-decree-modal">
              <div className="tg-modal-kicker">✦ 击退第 {waveIndex + 1} 波妖潮 · 凌霄赐福 ✦</div>
              <h2 className="tg-modal-title">敕封天道法旨</h2>
              <div className="tg-modal-subtitle">
                择一法旨加持天宫星盘，准备迎战下一波九幽大军
              </div>

              <div className="tg-decree-list">
                {decreeChoices.map((decree) => (
                  <button
                    key={decree.id}
                    type="button"
                    className="tg-decree-card"
                    data-testid={`tg-decree-${decree.id}`}
                    onClick={() => this.chooseDecree(decree)}
                  >
                    <div className="tg-decree-icon">
                      <Icon name={decree.icon || 'crown'} size={20} />
                    </div>
                    <div>
                      <div className="tg-decree-card-title">
                        <span>{decree.name}</span>
                        <span className="tg-decree-tag">{decree.tag}</span>
                      </div>
                      <div className="tg-decree-card-desc">{decree.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Victory / Defeat Seal Modal */}
        {gameResult && (
          <div className="tg-modal-backdrop" data-testid="tg-result-modal">
            <div className="tg-result-modal">
              <div className="tg-modal-kicker">
                {gameResult === 'victory' ? '✦ 诸天靖平 · 万仙来朝 ✦' : '✦ 南天门失守 · 仙阵重整 ✦'}
              </div>
              <h2 className="tg-modal-title">
                {gameResult === 'victory' ? '镇守天宫大捷' : '凌霄蒙尘 · 败北'}
              </h2>
              <div className="tg-modal-subtitle">
                坚守波次：{waveIndex + 1}/{WAVES.length} · 功德战绩：{score}
              </div>
              <button
                type="button"
                className="tg-primary-cta"
                onClick={this.restartGame}
              >
                重开天宫星盘 · 再战一局
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default TiangongTD;
