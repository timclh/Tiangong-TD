import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import TiangongTD, { isDeployableCell, hasCannonMount, isKnightJump } from './TiangongTD';
import { CELESTIAL_DECREES } from './data/tiangongAssets';

describe('TiangongTD (天宫弈 · 南天门守卫战)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container) {
      ReactDOM.unmountComponentAtNode(container);
      container.remove();
      container = null;
    }
  });

  test('renders initial celestial star-board, HUD stats, and starter towers', () => {
    act(() => {
      ReactDOM.render(<TiangongTD />, container);
    });
    expect(container.querySelector('[data-testid="tiangong-td"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="tg-stones"]').textContent).toContain('140');
    expect(container.querySelector('[data-testid="tg-core-hp"]').textContent).toContain('20/20');
    expect(container.querySelector('[data-testid="tg-tower-count"]').textContent).toContain('2 尊');
    expect(container.textContent).toContain('南天门');
  });

  test('isDeployableCell, hasCannonMount, and isKnightJump follow Xiangqi rules', () => {
    expect(isDeployableCell(0, 2)).toBe(false);
    expect(isDeployableCell(3, 2)).toBe(false);
    expect(isDeployableCell(7, 3)).toBe(false);
    expect(isDeployableCell(2, 3)).toBe(true);
    expect(isDeployableCell(5, 4)).toBe(true);

    // Cannon Screen-Mount (隔山架炮): 車 at (4,3) in front of 炮 at (5,3)
    const pao = { id: 'p1', type: 'pao', row: 5, col: 3 };
    const mount = { id: 'c1', type: 'che', row: 4, col: 3 };
    expect(hasCannonMount(pao, [pao, mount])).toBe(true);
    expect(hasCannonMount(pao, [pao])).toBe(false);

    // Knight "日"-jump
    expect(isKnightJump(4, 3, 2, 2)).toBe(true);
    expect(isKnightJump(4, 3, 4, 5)).toBe(false);
  });

  test('opens 玩法教学 guide modal and fires 炮 targeted Samadhi Fire Lotus zone', () => {
    const ref = React.createRef();
    act(() => {
      ReactDOM.render(<TiangongTD ref={ref} />, container);
    });

    const guideBtn = container.querySelector('[data-testid="tg-guide-btn"]');
    act(() => {
      guideBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[data-testid="tg-guide-modal"]')).not.toBeNull();

    // Select starter 炮 at (5, 3) and fire a Samadhi Fire Lotus zone at (2, 3)
    const paoTower = ref.current.state.towers.find((t) => t.type === 'pao');
    act(() => {
      ref.current.setState({ selectedTowerId: paoTower.id, showGuideModal: false, cannonAimMode: true });
    });
    const targetCell = container.querySelector('[data-testid="tg-cell-2-3"]');
    act(() => {
      targetCell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(ref.current.state.fireZones.length).toBeGreaterThan(0);
  });

  test('summoning a tower spends Spirit Stones and increases tower count', () => {
    act(() => {
      ReactDOM.render(<TiangongTD />, container);
    });
    const summonBtn = container.querySelector('[data-testid="tg-summon-btn"]');
    act(() => {
      summonBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="tg-stones"]').textContent).toContain('100');
    expect(container.querySelector('[data-testid="tg-tower-count"]').textContent).toContain('3 尊');
  });

  test('merging two 2-star towers triggers 3-star 法天象地 Awakening Cut-in modal', () => {
    const ref = React.createRef();
    act(() => {
      ReactDOM.render(<TiangongTD ref={ref} />, container);
    });

    act(() => {
      ref.current.setState({
        towers: [
          { id: 't1', type: 'ma', star: 2, row: 4, col: 1, lastShotAt: 0 },
          { id: 't2', type: 'ma', star: 2, row: 4, col: 2, lastShotAt: 0 },
        ],
      });
    });

    const mergeBtn = container.querySelector('[data-testid="tg-merge-btn"]');
    expect(mergeBtn.disabled).toBe(false);
    act(() => {
      mergeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="tg-awakening-modal"]')).not.toBeNull();
    expect(container.textContent).toContain('二郎显圣真君');
    expect(container.querySelector('[data-testid="tg-tower-count"]').textContent).toContain('1 尊');
  });

  test('selecting a Roguelike Celestial Decree advances wave and applies bonuses', () => {
    const ref = React.createRef();
    act(() => {
      ReactDOM.render(<TiangongTD ref={ref} />, container);
    });

    const decree = CELESTIAL_DECREES.find((d) => d.id === 'sadou_chengbing');
    act(() => {
      ref.current.setState({
        decreeChoices: [decree],
      });
    });

    const decreeBtn = container.querySelector('[data-testid="tg-decree-sadou_chengbing"]');
    act(() => {
      decreeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="tg-decree-modal"]')).toBeNull();
    expect(ref.current.state.waveIndex).toBe(1);
    expect(ref.current.state.activeDecrees).toContain('sadou_chengbing');
    expect(container.querySelector('[data-testid="tg-stones"]').textContent).toContain('230');
  });
});
