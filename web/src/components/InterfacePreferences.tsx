import { useEffect, useState } from 'react';

const KEY = 'wo-simple-mode';

export default function InterfacePreferences() {
  const [simple, setSimple] = useState(() => {
    try { return window.localStorage.getItem(KEY) !== 'false'; }
    catch { return true; }
  });

  useEffect(() => {
    const sync = () => {
      try { setSimple(window.localStorage.getItem(KEY) !== 'false'); }
      catch { setSimple(true); }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const changeMode = (next: boolean) => {
    try { window.localStorage.setItem(KEY, String(next)); } catch { /* private browsing */ }
    setSimple(next);
    window.dispatchEvent(new CustomEvent('wo-ui-preferences-changed', { detail: { simple: next } }));
  };

  return (
    <div className="wo-interface-settings">
      <h2>Interface</h2>
      <p className="wo-settings-intro">Escolha como deseja usar o WebObsidian. Nenhuma nota será alterada ao trocar de modo.</p>
      <div className="wo-mode-choices" role="group" aria-label="Modo da interface">
        <button type="button" className={`wo-mode-card ${simple ? 'selected' : ''}`}
          aria-pressed={simple} onClick={() => changeMode(true)}>
          <span className="wo-mode-symbol" aria-hidden="true">✦</span>
          <strong>Simples</strong>
          <span>Menos botões, navegação direta e destaque para criar, buscar e escrever.</span>
          <em>{simple ? 'Em uso' : 'Ativar'}</em>
        </button>
        <button type="button" className={`wo-mode-card ${!simple ? 'selected' : ''}`}
          aria-pressed={!simple} onClick={() => changeMode(false)}>
          <span className="wo-mode-symbol" aria-hidden="true">⌘</span>
          <strong>Avançado</strong>
          <span>Mostra os painéis e ferramentas extras para usuários experientes.</span>
          <em>{!simple ? 'Em uso' : 'Ativar'}</em>
        </button>
      </div>
      <div className="wo-interface-help">
        <strong>Como começar</strong>
        <p>1. Toque em <b>Nova nota</b> para escrever.</p>
        <p>2. Use <b>Pesquisar</b> para encontrar seus textos.</p>
        <p>3. Abra <b>Atalhos</b> para aprender os comandos do teclado.</p>
        <p>4. Volte a esta aba quando quiser mudar a aparência.</p>
      </div>
    </div>
  );
}
