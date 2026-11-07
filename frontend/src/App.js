import React, { Component } from 'react';
import './App.css';
import TiangongTD from './TiangongTD';
import { Icon } from './components/Icon';
import { DeityChibi } from './components/ChibiAvatar';
import { TOWER_TYPES, TOWER_KEYS } from './data/tiangongAssets';
import { isMuted, toggleMuted, onMutedChange, initSound, playSound, SOUND } from './services/SoundService';

class App extends Component {
  state = {
    soundMuted: isMuted(),
    showCodex: false,
  };

  componentDidMount() {
    initSound();
    this.unsubscribeMuted = onMutedChange((soundMuted) => this.setState({ soundMuted }));
  }

  componentWillUnmount() {
    if (this.unsubscribeMuted) this.unsubscribeMuted();
  }

  render() {
    const { soundMuted, showCodex } = this.state;

    return (
      <div className="tg-app-shell">
        <header className="tg-top-header">
          <div className="tg-brand">
            <span className="tg-brand-seal brush">天</span>
            <div>
              <h1 className="tg-brand-title brush">天宫弈 · 南天门守卫战</h1>
              <span className="tg-brand-sub">仙界星盘 · 三合一化神肉鸽塔防</span>
            </div>
          </div>

          <div className="tg-header-actions">
            <button
              type="button"
              className="tg-hdr-btn"
              onClick={() => {
                playSound(SOUND.SELECT);
                this.setState({ showCodex: true });
              }}
              data-testid="tg-open-codex"
            >
              <Icon name="crown" size={16} />
              <span>万仙图鉴</span>
            </button>

            <button
              type="button"
              className="tg-hdr-btn icon-only"
              onClick={() => {
                if (!toggleMuted()) playSound(SOUND.SELECT);
              }}
              aria-label={soundMuted ? '开启声音' : '静音'}
              title={soundMuted ? '开启声音' : '静音'}
            >
              <Icon name={soundMuted ? 'muted' : 'sound'} size={18} />
            </button>
          </div>
        </header>

        <main className="tg-main-stage">
          <TiangongTD />
        </main>

        {/* Deity Codex Modal (万仙图鉴 · 3★法天象地一览) */}
        {showCodex && (
          <div
            className="tg-modal-backdrop"
            data-testid="tg-codex-modal"
            onClick={() => this.setState({ showCodex: false })}
          >
            <div
              className="tg-decree-modal tg-codex-box"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tg-modal-kicker">✦ 凌霄宝殿 · 五部正神图鉴 ✦</div>
              <h2 className="tg-modal-title">三合一化神 · 法天象地</h2>
              <div className="tg-modal-subtitle">
                两枚同星同名棋子合阵升星，3★ 觉醒真神法相并释放全屏天罚！
              </div>

              <div className="tg-codex-list">
                {TOWER_KEYS.map((key) => {
                  const t = TOWER_TYPES[key];
                  const t3 = t.tiers[3];
                  return (
                    <div key={key} className="tg-codex-item">
                      <DeityChibi type={key} star={3} size={50} />
                      <div className="tg-codex-meta">
                        <div className="tg-codex-name">
                          1★ {t.tiers[1].name} → 2★ {t.tiers[2].name} →{' '}
                          <span className="tg-codex-t3">3★ {t3.name}</span>
                        </div>
                        <div className="tg-codex-role">
                          {t.role} · {t.patternLabel}
                        </div>
                        <div className="tg-codex-ult">3★神通：{t3.awakeningSkill}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="tg-primary-cta"
                onClick={() => this.setState({ showCodex: false })}
              >
                返回南天门星盘
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default App;
