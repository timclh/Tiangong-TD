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
import { DeityChibi, DemonChibi } from './components/ChibiAvatar';
import {
  GRID_COLS,
  GRID_ROWS,
  RIVER_ROW,
  CORE_POS,
  AI_VISUAL_SLOTS,
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
 * Xiangqi Cannon Screen-Mount rule (隔山打牛 · 炮架子):
 * Returns true if `paoTower` has at least one allied tower in front of it
 * (smaller row index, same or adjacent column) acting as a cannon mount!
 */
export function hasCannonMount(paoTower, allTowers) {
  if (!paoTower || paoTower.type !== 'pao') return false;
  return allTowers.some(
    (other) =>
      other.id !== paoTower.id &&
      other.row < paoTower.row &&
      Math.abs(other.col - paoTower.col) <= 1
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

  createInitialState() {
    // Start with 2 pre-deployed 1★ Celestial Towers (車 in front as cannon mount, 炮 behind it!)
    const starterTowers = [
      { id: uid('tw'), type: 'che', star: 1, row: 4, col: 3, lastShotAt: 0, skillReadyAt: 0 },
      { id: uid('tw'), type: 'pao', star: 1, row: 5, col: 3, lastShotAt: 0, skillReadyAt: 0 },
    ];
    return {
      boardWidth: computeBoardWidth(),
      tiltEnabled: true,
      speedMultiplier: 1,
      isPaused: false,
      showGuideModal: false,
      cannonAimMode: false, // when true and a 炮 is selected, next board click bombards that spot!
      waveIndex: 0, // 0-based index into WAVES (0..14)
      stones: 140, // 仙灵石
      summonCount: 0,
      coreHp: 20,
      maxCoreHp: 20,
      score: 0,
      kills: 0,
      ultCharge: 45, // 0..100 for 诛仙剑阵
      towers: starterTowers,
      selectedTowerId: starterTowers[0].id, // pre-select 車 so user immediately sees its cross rail & controls!
      enemies: [],
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
      showGuideModal,
      decreeChoices,
      awakeningCutIn,
      gameResult,
      speedMultiplier,
    } = this.state;

    if (isPaused || showGuideModal || decreeChoices || awakeningCutIn || gameResult) {
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
        ultCharge,
        fireZones,
        fxBeams,
        floatTexts,
        waveIndex,
        activeDecrees,
      } = prev;

      const hasDecree = (id) => activeDecrees.includes(id);
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

      // 2. Move enemies & apply burn / fireZone / river slow / 兵 body-block
      const survivingEnemies = [];
      let hpLost = 0;
      let stonesEarned = 0;
      let killsEarned = 0;
      const newFloats = [];

      nextEnemies.forEach((enemy) => {
        // Burn damage over time from Samadhi Fire
        if (enemy.burnUntil > now) {
          const burnDmg = ((hasDecree('sanmei_zhenhuo') ? 38 : 20) * dtMs) / 1000;
          enemy.hp -= burnDmg;
        }
        // Standing in an active Nezha Fire Lotus Zone (火海)
        const inFireZone = activeFireZones.some(
          (fz) => Math.hypot(enemy.row - fz.row, enemy.col - fz.col) <= fz.radius
        );
        if (inFireZone) {
          enemy.hp -= (48 * dtMs) / 1000;
          enemy.slowUntil = Math.max(enemy.slowUntil, now + 400);
        }

        if (enemy.hp <= 0) {
          const rewardBonus = hasDecree('sadou_chengbing') ? 1.3 : 1.0;
          stonesEarned += Math.round(enemy.reward * rewardBonus);
          killsEarned += 1;
          return;
        }

        // Check if blocked by a front-line 兵 (Guard) tower right in front of it
        const blockingGuard = towers.find(
          (t) =>
            t.type === 'bing' &&
            Math.abs(t.col - enemy.col) <= 0.55 &&
            t.row >= enemy.row &&
            t.row - enemy.row <= 0.65
        );

        // Check if on Celestial River (Row 2.5 .. 3.5)
        const inRiver = enemy.row >= RIVER_ROW - 0.45 && enemy.row <= RIVER_ROW + 0.45;
        const riverSlow = inRiver ? (hasDecree('ruoshui_tianhe') ? 0.35 : 0.65) : 1.0;
        const debuffSlow = enemy.slowUntil > now ? 0.45 : 1.0;
        const guardSlow = blockingGuard ? 0.18 : 1.0;
        const step = (enemy.speed * riverSlow * debuffSlow * guardSlow * dtMs) / 1000;

        enemy.row += step;
        // Converge horizontally toward Nantianmen Gate once past row 5.2
        if (enemy.row > 5.0) {
          const dx = CORE_POS.col - enemy.col;
          enemy.col += Math.sign(dx) * Math.min(Math.abs(dx), step * 0.85);
        }

        // Reached Nantianmen Core?
        if (enemy.row >= CORE_POS.row - 0.15) {
          hpLost += enemy.isBoss ? 5 : 1;
          newFloats.push({
            id: uid('flt'),
            col: CORE_POS.col,
            row: CORE_POS.row,
            text: enemy.isBoss ? '南天门 -5!' : '仙气 -1',
            crit: true,
            expiresAt: now + 600,
          });
        } else {
          survivingEnemies.push(enemy);
        }
      });

      nextEnemies = survivingEnemies;

      // 3. Towers acquire targets & fire
      const newBeams = [];
      const nextTowers = towers.map((t) => ({ ...t }));

      if (nextEnemies.length > 0) {
        nextTowers.forEach((tower) => {
          const spec = TOWER_TYPES[tower.type];
          const tierSpec = spec.tiers[tower.star] || spec.tiers[1];

          // Check adjacent 相 (Xiang) aura speed bonus
          let speedMult = hasDecree('pantao_shenghui') ? 1.2 : 1.0;
          nextTowers.forEach((other) => {
            if (other.id !== tower.id && other.type === 'xiang') {
              const dist = Math.hypot(other.row - tower.row, other.col - tower.col);
              if (dist <= 1.6) {
                speedMult += 0.25 * other.star;
              }
            }
          });

          const effectiveCooldown = spec.cooldownMs / speedMult;
          if (now - tower.lastShotAt < effectiveCooldown / speedMultiplier) {
            return;
          }

          // Calculate damage
          let dmg = spec.baseDamage * tierSpec.dmgMult;
          if (tower.star >= 2 && hasDecree('fatian_xiangdi')) {
            dmg *= 1.45;
          }

          let fired = false;

          if (tower.type === 'che') {
            // 车: Cross-line piercing lightning along same row or column (within tolerance)
            const inCross = nextEnemies.filter(
              (e) => Math.abs(e.col - tower.col) <= 0.65 || Math.abs(e.row - tower.row) <= 0.65
            );
            if (inCross.length > 0) {
              fired = true;
              const thunderBoost = hasDecree('jiutian_shenlei') ? 1.4 : 1.0;
              inCross.forEach((e) => {
                const riverVuln =
                  hasDecree('ruoshui_tianhe') && Math.abs(e.row - RIVER_ROW) <= 0.5 ? 1.35 : 1.0;
                const finalDmg = Math.round(dmg * thunderBoost * riverVuln);
                e.hp -= finalDmg;
                if (hasDecree('jiutian_shenlei') && Math.random() < 0.3) {
                  e.slowUntil = Math.max(e.slowUntil, now + 1400);
                }
              });
              const lead = inCross[0];
              newFloats.push({
                id: uid('flt'),
                col: lead.col,
                row: lead.row,
                text: `⚡-${Math.round(dmg * thunderBoost)}`,
                crit: tower.star === 3,
                expiresAt: now + 500,
              });
              newBeams.push({
                id: uid('fx'),
                kind: 'cross',
                fromCol: tower.col,
                fromRow: tower.row,
                toCol: lead.col,
                toRow: lead.row,
                color: spec.color,
                star: tower.star,
                expiresAt: now + 220,
              });
            }
          } else if (tower.type === 'pao') {
            // 炮: Target furthest-ahead enemy & deal AoE splash + burn.
            // If another tower is ahead of 炮 (隔山打牛 · 架炮), deal 1.8x heavy artillery damage!
            const mounted = hasCannonMount(tower, nextTowers);
            const mountMult = mounted ? 1.8 : 1.0;
            const paoDmg = Math.round(dmg * mountMult);
            const sorted = [...nextEnemies].sort((a, b) => b.row - a.row);
            const target = sorted[0];
            if (target) {
              fired = true;
              const splashR =
                (spec.splashRadius || 1.35) * (hasDecree('sanmei_zhenhuo') ? 1.4 : 1.0);
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
                text: mounted ? `🔥隔山重炮 -${paoDmg}!` : `🔥-${paoDmg}`,
                crit: mounted || tower.star >= 2,
                expiresAt: now + 520,
              });
              newBeams.push({
                id: uid('fx'),
                kind: 'fireball',
                fromCol: tower.col,
                fromRow: tower.row,
                toCol: target.col,
                toRow: target.row,
                color: spec.color,
                star: tower.star,
                expiresAt: now + 260,
              });
            }
          } else if (tower.type === 'ma') {
            // 马: High-crit jump strike on enemies within range
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
                  text: isCrit ? `天眼暴击 -${hitDmg}!` : `-${hitDmg}`,
                  crit: isCrit,
                  expiresAt: now + 520,
                });
                newBeams.push({
                  id: uid('fx'),
                  kind: 'slash',
                  fromCol: tower.col,
                  fromRow: tower.row,
                  toCol: target.col,
                  toRow: target.row,
                  color: spec.color,
                  star: tower.star,
                  expiresAt: now + 220,
                });
              });
            }
          } else {
            // 兵 / 相: Shockwave pulse around tower
            const inRange = nextEnemies.filter(
              (e) => Math.hypot(e.row - tower.row, e.col - tower.col) <= spec.range
            );
            if (inRange.length > 0) {
              fired = true;
              inRange.forEach((e) => {
                e.hp -= Math.round(dmg);
                if (tower.type === 'bing') {
                  e.slowUntil = Math.max(e.slowUntil, now + 1300);
                }
              });
              newFloats.push({
                id: uid('flt'),
                col: inRange[0].col,
                row: inRange[0].row,
                text: `-${Math.round(dmg)}`,
                crit: tower.star === 3,
                expiresAt: now + 480,
              });
              newBeams.push({
                id: uid('fx'),
                kind: 'ring',
                fromCol: tower.col,
                fromRow: tower.row,
                toCol: inRange[0].col,
                toRow: inRange[0].row,
                color: spec.color,
                star: tower.star,
                expiresAt: now + 240,
              });
            }
          }

          if (fired) {
            tower.lastShotAt = now;
          }
        });
      }

      // Sweep enemies killed by tower shots this tick
      const afterShotEnemies = [];
      nextEnemies.forEach((e) => {
        if (e.hp <= 0) {
          const rewardBonus = hasDecree('sadou_chengbing') ? 1.3 : 1.0;
          stonesEarned += Math.round(e.reward * rewardBonus);
          killsEarned += 1;
        } else {
          afterShotEnemies.push(e);
        }
      });

      const nextCoreHp = Math.max(0, coreHp - hpLost);
      const nextStones = stones + stonesEarned;
      const nextKills = kills + killsEarned;
      const nextScore = score + killsEarned * 25 + stonesEarned;
      const chargeRate = hasDecree('lingxiao_jianzhen') ? 5.5 : 3.5;
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
          score: nextScore + 150,
          ultCharge: nextUlt,
          decreeChoices: shuffled,
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
    const { stones, towers, gameResult } = this.state;
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

    const spot = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const type = TOWER_KEYS[Math.floor(Math.random() * TOWER_KEYS.length)];
    const newTower = {
      id: uid('tw'),
      type,
      star: 1,
      row: spot.row,
      col: spot.col,
      lastShotAt: 0,
    };

    playSound(SOUND.PLACE);
    hapticTap();

    this.setState((prev) => ({
      stones: prev.stones - cost,
      summonCount: prev.summonCount + 1,
      towers: [...prev.towers, newTower],
      selectedTowerId: newTower.id,
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
          pairs.push([towers[i], towers[j]]);
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
  triggerTowerTacticalSkill = (targetRow = null, targetCol = null) => {
    const { towers, selectedTowerId, enemies } = this.state;
    const tower = towers.find((t) => t.id === selectedTowerId);
    if (!tower) return false;

    const now = Date.now();
    const spec = TOWER_TYPES[tower.type];
    const tierSpec = spec.tiers[tower.star] || spec.tiers[1];
    const baseSkillDmg = Math.round(spec.baseDamage * tierSpec.dmgMult * 2.4);

    playSound(SOUND.CHECK);
    hapticImpact();

    this.setState((prev) => {
      let nextEnemies = prev.enemies.map((e) => ({ ...e }));
      let nextFireZones = [...(prev.fireZones || [])];
      let nextBeams = [...prev.fxBeams];
      let nextFloats = [...prev.floatTexts];
      let nextTowers = prev.towers.map((t) => ({ ...t }));

      if (tower.type === 'che') {
        // ⚡ 車: Cross-Line Thunder Overdrive along its row & column!
        nextEnemies.forEach((e) => {
          if (Math.abs(e.col - tower.col) <= 0.85 || Math.abs(e.row - tower.row) <= 0.85) {
            e.hp -= baseSkillDmg;
            e.slowUntil = Math.max(e.slowUntil, now + 1600);
          }
        });
        nextBeams.push({
          id: uid('fx'),
          kind: 'cross',
          fromCol: tower.col,
          fromRow: tower.row,
          toCol: tower.col,
          toRow: tower.row,
          color: '#F0CF86',
          star: 3,
          expiresAt: now + 420,
        });
        nextFloats.push({
          id: uid('flt'),
          col: tower.col,
          row: Math.max(1, tower.row - 1),
          text: `⚡雷车十字轰击 -${baseSkillDmg}!`,
          crit: true,
          expiresAt: now + 680,
        });
      } else if (tower.type === 'pao') {
        // 🔥 炮: Launch Samadhi Fire Lotus at target cell (or lead enemy / River center)
        const lead = [...nextEnemies].sort((a, b) => b.row - a.row)[0];
        const aimRow = targetRow !== null ? targetRow : lead ? lead.row : RIVER_ROW;
        const aimCol = targetCol !== null ? targetCol : lead ? lead.col : CORE_POS.col;
        const mounted = hasCannonMount(tower, nextTowers);
        const fireDmg = Math.round(baseSkillDmg * (mounted ? 1.5 : 1.0));

        nextEnemies.forEach((e) => {
          if (Math.hypot(e.row - aimRow, e.col - aimCol) <= 1.85) {
            e.hp -= fireDmg;
            e.burnUntil = Math.max(e.burnUntil, now + 4000);
          }
        });
        nextFireZones.push({
          id: uid('fz'),
          row: aimRow,
          col: aimCol,
          radius: 1.45,
          expiresAt: now + 4500,
        });
        nextBeams.push({
          id: uid('fx'),
          kind: 'fireball',
          fromCol: tower.col,
          fromRow: tower.row,
          toCol: aimCol,
          toRow: aimRow,
          color: '#E5594B',
          star: 3,
          expiresAt: now + 420,
        });
        nextFloats.push({
          id: uid('flt'),
          col: aimCol,
          row: aimRow,
          text: `🔥三昧火莲 -${fireDmg}!`,
          crit: true,
          expiresAt: now + 700,
        });
      } else {
        // 馬 / 兵 / 相: Shockwave burst around tower (or at target cell)
        const centerR = targetRow !== null ? targetRow : tower.row;
        const centerC = targetCol !== null ? targetCol : tower.col;
        nextEnemies.forEach((e) => {
          if (Math.hypot(e.row - centerR, e.col - centerC) <= 2.3) {
            e.hp -= baseSkillDmg;
            e.slowUntil = Math.max(e.slowUntil, now + 1800);
          }
        });
        nextBeams.push({
          id: uid('fx'),
          kind: 'ring',
          fromCol: centerC,
          fromRow: centerR,
          toCol: centerC,
          toRow: centerR,
          color: spec.color,
          star: 3,
          expiresAt: now + 400,
        });
        nextFloats.push({
          id: uid('flt'),
          col: centerC,
          row: centerR,
          text: `✦神技 -${baseSkillDmg}!`,
          crit: true,
          expiresAt: now + 650,
        });
      }

      return {
        enemies: nextEnemies,
        fireZones: nextFireZones,
        fxBeams: nextBeams,
        floatTexts: nextFloats,
        cannonAimMode: false,
        towers: nextTowers.map((t) =>
          t.id === tower.id
            ? {
                ...t,
                row: targetRow !== null && isDeployableCell(targetRow, targetCol) && tower.type !== 'pao' ? targetRow : t.row,
                col: targetCol !== null && isDeployableCell(targetRow, targetCol) && tower.type !== 'pao' ? targetCol : t.col,
                skillReadyAt: now + 4000,
              }
            : t
        ),
      };
    });
    return true;
  };

  handleCellClick = (row, col) => {
    const { towers, selectedTowerId, cannonAimMode } = this.state;
    const clickedTower = towers.find((t) => t.row === row && t.col === col);
    const selectedTower = towers.find((t) => t.id === selectedTowerId);

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

  castUltimate = () => {
    const { ultCharge, enemies } = this.state;
    if (ultCharge < 100) return false;
    playSound(SOUND.CHECK);
    hapticNotification('success');

    const now = Date.now();
    const ultMult = this.hasDecree('lingxiao_jianzhen') ? 1.8 : 1.0;
    const dmg = Math.round(320 * ultMult);

    this.setState((prev) => ({
      ultCharge: this.hasDecree('lingxiao_jianzhen') ? 25 : 0,
      enemies: prev.enemies.map((e) => ({
        ...e,
        hp: e.hp - dmg,
        slowUntil: Math.max(e.slowUntil, now + 1800),
      })),
      floatTexts: [
        ...prev.floatTexts,
        ...enemies.slice(0, 6).map((e) => ({
          id: uid('flt'),
          col: e.col,
          row: e.row,
          text: `🗡️诛仙 -${dmg}!`,
          crit: true,
          expiresAt: now + 650,
        })),
      ],
    }));
    return true;
  };

  chooseDecree = (decree) => {
    if (!decree) return;
    playSound(SOUND.PLACE);
    hapticImpact();

    this.setState((prev) => {
      const nextWaveIdx = prev.waveIndex + 1;
      const nextDecrees = prev.activeDecrees.includes(decree.id)
        ? prev.activeDecrees
        : [...prev.activeDecrees, decree.id];
      const bonusStones = decree.id === 'sadou_chengbing' ? 90 : 0;
      const bonusHp = decree.id === 'pantao_shenghui' ? 6 : 0;

      return {
        activeDecrees: nextDecrees,
        decreeChoices: null,
        waveIndex: nextWaveIdx,
        spawnQueue: this.buildWaveSpawnQueue(nextWaveIdx),
        spawnCooldownMs: 500,
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
      showGuideModal,
      cannonAimMode,
      waveIndex,
      stones,
      coreHp,
      maxCoreHp,
      score,
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

    // Contextual dynamic step-by-step coach tip
    let stepTip = '💡 点击棋盘上的 Q版神将 查看专属走法，或点下方【敕令募兵】召唤新神将！';
    if (stones >= summonCost && towers.length <= 3) {
      stepTip = `👆 你有 ${stones} 仙灵石！快点下方红色【敕令募兵】召唤更多 Q版天兵神将！`;
    } else if (mergePairs.length > 0) {
      stepTip = `✨ 场上已有 ${mergePairs.length} 对同名神将！点绿色【一键合阵】或互点两尊同名棋子升星化神！`;
    } else if (selectedTower?.type === 'che') {
      stepTip = '⚡ 已选【車·雷震子】：自动攻击同行同列十字线！点击发光十字格可发动【雷车冲刺】直线秒怪！';
    } else if (selectedTower?.type === 'pao') {
      stepTip = selectedMounted
        ? '🔥 已选【炮·哪吒】（已激活隔山架炮×1.8倍伤害！）：点下方【指哪打哪】再点棋盘任意格发射火莲火海！'
        : '🔥 已选【炮·哪吒】：把它移到其他神将正后方即可激活【隔山打牛·伤害×1.8】！点天河格可直接轰炸！';
    } else if (selectedTower?.type === 'ma') {
      stepTip = '🐎 已选【馬·二郎神】：点击周围发光的“日”字格，可发动【哮天跳斩】瞬移暴击！';
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
                  data-testid="tg-guide-btn"
                  onClick={() => this.setState({ showGuideModal: true })}
                >
                  📖 玩法教学
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
                <span className="tg-stat-label">仙灵石</span>
                <span className="tg-stat-val gold" data-testid="tg-stones">
                  ✦ {stones}
                </span>
              </div>
              <div className="tg-stat-pill">
                <span className="tg-stat-label">南天门仙气</span>
                <span
                  className={`tg-stat-val hp ${coreHp <= 6 ? 'low' : ''}`}
                  data-testid="tg-core-hp"
                >
                  ♥ {coreHp}/{maxCoreHp}
                </span>
              </div>
              <div className="tg-stat-pill">
                <span className="tg-stat-label">驻守神将</span>
                <span className="tg-stat-val" data-testid="tg-tower-count">
                  {towers.length} 尊
                </span>
              </div>
              <div className="tg-stat-pill">
                <span className="tg-stat-label">功德战绩</span>
                <span className="tg-stat-val">{score}</span>
              </div>
            </div>
          </div>

          {/* Live Interactive Step-by-Step Guide Bar */}
          <div className="tg-step-guide-bar" data-testid="tg-step-guide">
            <span>{stepTip}</span>
          </div>

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

                      const isPaoAim =
                        selectedTower &&
                        selectedTower.type === 'pao' &&
                        cannonAimMode &&
                        !tower;

                      const activeFireHere = (fireZones || []).some(
                        (fz) => Math.hypot(r - fz.row, c - fz.col) <= 0.85
                      );

                      const paoMounted = tower ? hasCannonMount(tower, towers) : false;

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
                            isMaJump ? 'knight-highlight' : '',
                            isPaoAim ? 'pao-aim-highlight' : '',
                            activeFireHere ? 'burning-cell' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => this.handleCellClick(r, c)}
                        >
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

                {/* SVG Attack Beams & Projectiles */}
                <svg
                  className="tg-fx-svg"
                  viewBox={`0 0 ${exactWidth} ${exactHeight}`}
                >
                  {fxBeams.map((fx) => {
                    const x1 = (fx.fromCol + 0.5) * cellSize;
                    const y1 = (fx.fromRow + 0.5) * cellSize;
                    const x2 = (fx.toCol + 0.5) * cellSize;
                    const y2 = (fx.toRow + 0.5) * cellSize;
                    if (fx.kind === 'cross') {
                      return (
                        <g key={fx.id}>
                          <line
                            x1={x1}
                            y1={0}
                            x2={x1}
                            y2={exactHeight}
                            stroke={fx.color}
                            strokeWidth={fx.star * 2.5}
                            strokeOpacity="0.65"
                          />
                          <line
                            x1={0}
                            y1={y1}
                            x2={exactWidth}
                            y2={y1}
                            stroke={fx.color}
                            strokeWidth={fx.star * 2.5}
                            strokeOpacity="0.65"
                          />
                        </g>
                      );
                    }
                    if (fx.kind === 'fireball') {
                      return (
                        <g key={fx.id}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#F0CF86"
                            strokeWidth={fx.star * 2}
                            strokeDasharray="4 2"
                          />
                          <circle
                            cx={x2}
                            cy={y2}
                            r={cellSize * (0.55 + fx.star * 0.15)}
                            fill="rgba(229, 89, 75, 0.28)"
                            stroke="#E5594B"
                            strokeWidth="2"
                          />
                        </g>
                      );
                    }
                    if (fx.kind === 'ring') {
                      return (
                        <circle
                          key={fx.id}
                          cx={x1}
                          cy={y1}
                          r={cellSize * 1.3}
                          fill="none"
                          stroke={fx.color}
                          strokeWidth={fx.star * 2}
                          strokeOpacity="0.7"
                        />
                      );
                    }
                    return (
                      <line
                        key={fx.id}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={fx.color}
                        strokeWidth={fx.star * 2.2}
                      />
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
                className={`tg-action-btn summon ${stones >= summonCost && towers.length <= 4 ? 'pulse-cta' : ''}`}
                data-testid="tg-summon-btn"
                disabled={stones < summonCost}
                onClick={this.summonTower}
              >
                <span className="tg-btn-main">
                  <Icon name="sparkles" size={15} /> 敕令募兵
                </span>
                <span className="tg-btn-sub">消耗 {summonCost} 仙灵石</span>
              </button>

              <button
                type="button"
                className={`tg-action-btn merge ${mergePairs.length > 0 ? 'pulse-merge' : ''}`}
                data-testid="tg-merge-btn"
                disabled={mergePairs.length === 0}
                onClick={this.autoMergePair}
              >
                <span className="tg-btn-main">
                  <Icon name="zap" size={15} /> 一键合阵 ({mergePairs.length})
                </span>
                <span className="tg-btn-sub">同名升星 · 3★化神</span>
              </button>

              <button
                type="button"
                className={`tg-action-btn ult ${ultCharge >= 100 ? 'ready' : ''}`}
                data-testid="tg-ult-btn"
                disabled={ultCharge < 100}
                onClick={this.castUltimate}
              >
                <span className="tg-btn-main">
                  <Icon name="crown" size={15} /> 诛仙剑阵
                </span>
                <span className="tg-btn-sub">
                  {ultCharge >= 100 ? '点击释放全屏大招!' : `仙力充能 ${Math.floor(ultCharge)}%`}
                </span>
              </button>
            </div>

            {/* Selected Tower Tactical Bar */}
            <div className="tg-inspector">
              {selectedTower ? (
                <>
                  <div className="tg-inspector-info">
                    <span className="tg-inspector-name">
                      【{selectedSpec.glyph} · {'★'.repeat(selectedTower.star)}】{selectedTier.name}
                      {selectedMounted ? ' 🔥已激活【隔山架炮×1.8】' : ''}
                    </span>
                    <span className="tg-inspector-desc">
                      {selectedTower.type === 'che' &&
                        '玩法：自动劈同行同列！点发光十字格可【雷车冲刺】，或点右侧按钮释放十字轰击'}
                      {selectedTower.type === 'pao' &&
                        '玩法：前排有其他神将时伤害×1.8！点右侧【指哪打哪】再点棋盘即可发射三昧火海'}
                      {selectedTower.type === 'ma' &&
                        '玩法：点击发光的“日”字格可发动【哮天跳斩】瞬移收割！'}
                      {(selectedTower.type === 'bing' || selectedTower.type === 'xiang') &&
                        `${selectedSpec.role} · 点空位可换防，点同名同星棋子可合体升星`}
                    </span>
                  </div>

                  <div className="tg-inspector-btns">
                    {selectedTower.type === 'pao' ? (
                      <button
                        type="button"
                        data-testid="tg-pao-bombard-btn"
                        className={`tg-mini-btn active`}
                        onClick={() => {
                          if (cannonAimMode) {
                            this.triggerTowerTacticalSkill();
                          } else {
                            this.setState({ cannonAimMode: true });
                          }
                        }}
                      >
                        {cannonAimMode ? '🔥 立即轰炸!' : '🎯 指哪打哪'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-testid="tg-tactical-skill-btn"
                        className="tg-mini-btn active"
                        onClick={() => this.triggerTowerTacticalSkill()}
                      >
                        {selectedTower.type === 'che' ? '⚡ 十字雷暴' : '✦ 释放神技'}
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
              <div className="tg-modal-kicker">✦ 30秒上手 · 仙界星盘兵法 ✦</div>
              <h2 className="tg-modal-title">怎么操作？【車】与【炮】怎么玩？</h2>

              <div className="tg-codex-list">
                <div className="tg-codex-item">
                  <DeityChibi type="che" star={2} size={46} />
                  <div className="tg-codex-meta">
                    <div className="tg-codex-name">
                      <span className="tg-codex-t3">⚡【車 · 雷震子】怎么玩：十字雷轨 + 雷车冲刺</span>
                    </div>
                    <div className="tg-codex-ult">
                      • <strong>十字贯穿</strong>：自动发射天雷劈穿<strong>同一行 + 同一列</strong>所有妖怪。<br />
                      • <strong>互动操作</strong>：点选【車】后棋盘会亮起蓝色十字雷轨，点击十字轨上的空位即可发动<strong>【雷车冲刺】</strong>碾压整条线！
                    </div>
                  </div>
                </div>

                <div className="tg-codex-item">
                  <DeityChibi type="pao" star={2} size={46} hasMountBuff />
                  <div className="tg-codex-meta">
                    <div className="tg-codex-name">
                      <span className="tg-codex-t3">🔥【炮 · 哪吒】怎么玩：隔山架炮 + 指哪打哪</span>
                    </div>
                    <div className="tg-codex-ult">
                      • <strong>隔山打牛（架炮）</strong>：把【炮】放在任意其他神将正后方（有前排当炮架），自动亮起<strong>🔥架炮×1.8</strong>，炮击伤害暴增 80%！<br />
                      • <strong>指哪打哪（火海）</strong>：选中【炮】后点<strong>【🎯指哪打哪】</strong>再点棋盘任意位置，立即发射三昧火莲炸出一片持续烧怪的火海！
                    </div>
                  </div>
                </div>

                <div className="tg-codex-item">
                  <DeityChibi type="ma" star={2} size={46} />
                  <div className="tg-codex-meta">
                    <div className="tg-codex-name">
                      <span className="tg-codex-t3">🐎【馬/兵/相】与三合一化神</span>
                    </div>
                    <div className="tg-codex-ult">
                      • <strong>募兵与合阵</strong>：有 40 仙灵石就点左下角红色<strong>【敕令募兵】</strong>；有两尊同名同星神将就点绿色<strong>【一键合阵】</strong>（1★→2★→3★觉醒全屏法天象地大招！）。
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="tg-primary-cta"
                onClick={() => this.setState({ showGuideModal: false })}
              >
                明白兵法 · 立即实战
              </button>
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
