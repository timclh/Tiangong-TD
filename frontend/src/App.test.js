import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import App from './App';

it('renders standalone Tiangong TD app without crashing and opens Deity Codex', () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  act(() => {
    ReactDOM.render(<App />, div);
  });
  expect(div.textContent).toContain('天宫弈 · 南天门守卫战');

  const codexBtn = div.querySelector('[data-testid="tg-open-codex"]');
  act(() => {
    codexBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  expect(div.querySelector('[data-testid="tg-codex-modal"]')).not.toBeNull();

  ReactDOM.unmountComponentAtNode(div);
  div.remove();
});
