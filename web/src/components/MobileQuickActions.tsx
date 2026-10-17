import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import Icon from './Icon';

/** Compact, accessible quick actions inspired by the Obsidian Mobile FAB.
 * Integrates with our own React/Zustand commands, not Obsidian's plugin API. */
export default function MobileQuickActions({ openShortcuts }: { openShortcuts: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const newNote = useStore((s) => s.newNote);
  const setLeftPanel = useStore((s) => s.setLeftPanel);
  const setMobileDrawer = useStore((s) => s.setMobileDrawer);
  const mobileDrawer = useStore((s) => s.mobileDrawer);
  const activePath = useStore((s) => s.activePath);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const check = () => setKeyboardOpen(window.innerHeight - viewport.height - viewport.offsetTop > 130);
    check();
    viewport.addEventListener('resize', check);
    viewport.addEventListener('scroll', check);
    return () => {
      viewport.removeEventListener('resize', check);
      viewport.removeEventListener('scroll', check);
    };
  }, []);
  useEffect(() => setExpanded(false), [activePath, mobileDrawer]);

  if (keyboardOpen || mobileDrawer) return null;
  const create = () => { setExpanded(false); void newNote(); };
  const search = () => { setExpanded(false); setLeftPanel('search'); setMobileDrawer('left'); };
  const files = () => { setExpanded(false); setLeftPanel('files'); setMobileDrawer('left'); };
  const help = () => { setExpanded(false); openShortcuts(); };

  return (
    <div className="wo-quick-actions">
      {expanded && (
        <>
          <button className="wo-quick-dismiss" aria-label="Fechar ações rápidas" onClick={() => setExpanded(false)} />
          <div className="wo-quick-menu" aria-label="Ações rápidas">
            <button onClick={create}><Icon name="file-plus" size={18} /> Nova nota</button>
            <button onClick={search}><Icon name="search" size={18} /> Pesquisar</button>
            <button onClick={help}><Icon name="command" size={18} /> Atalhos e ajuda</button>
          </div>
        </>
      )}
      {!activePath && (
        <nav className="wo-mobile-bottom-nav" aria-label="Navegação principal">
          <button type="button" onClick={files}><Icon name="file-text" size={19} /><span>Notas</span></button>
          <button type="button" onClick={search}><Icon name="search" size={19} /><span>Buscar</span></button>
          <button type="button" onClick={create}><Icon name="plus" size={19} /><span>Nova nota</span></button>
          <button type="button" onClick={help}><Icon name="command" size={19} /><span>Ajuda</span></button>
        </nav>
      )}
      <button
        type="button"
        className="wo-quick-fab"
        aria-label={expanded ? 'Fechar ações rápidas' : 'Abrir ações rápidas'}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <Icon name={expanded ? 'x' : 'plus'} size={24} />
      </button>
    </div>
  );
}
