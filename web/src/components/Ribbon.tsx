import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { api } from '../lib/api';
import Icon from './Icon';

export default function Ribbon({ onTheme }: { onTheme: () => void }) {
  const setLeftPanel = useStore((s) => s.setLeftPanel);
  const leftPanel = useStore((s) => s.leftPanel);
  const setGraph = useStore((s) => s.setGraph);
  const setSettings = useStore((s) => s.setSettings);
  const setPalette = useStore((s) => s.setPalette);
  const openDailyNote = useStore((s) => s.openDailyNote);
  const notify = useStore((s) => s.notify);
  const loadTree = useStore((s) => s.loadTree);

  // Show the Sync-now button only when git sync is enabled in settings.
  const [gitEnabled, setGitEnabled] = useState(false);
  const [syncing, setSyncing] = useState(false);
  useEffect(() => {
    const refresh = () => api.gitStatus().then((g) => setGitEnabled(!!g?.enabled)).catch(() => setGitEnabled(false));
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, []);

  const sync = async () => {
    if (syncing) return;
    setSyncing(true);
    notify('Sincronizando…');
    try {
      const r = await api.gitSync();
      notify(r.ok ? 'Sincronizado ✓' : `Sincronização: ${r.log.at(-1)}`);
      await loadTree();
    } catch (e: any) {
      notify(`Falha na sincronização: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="ribbon">
      <button className={leftPanel === 'files' ? 'ativo' : ''} title="Arquivos" onClick={() => setLeftPanel('files')}>
        <Icon name="file-text" size={18} />
      </button>
      <button className={leftPanel === 'search' ? 'ativo' : ''} title="Pesquisar (⌘⇧F)" onClick={() => setLeftPanel('search')}>
        <Icon name="search" size={18} />
      </button>
      <button className="wo-advanced-action" title="Visualização em grafo" onClick={() => setGraph(true)}>
        <Icon name="graph" size={18} />
      </button>
      <button className={`wo-advanced-action ${leftPanel === 'bookmarks' ? 'ativo' : ''}`} title="Favoritos e recentes" onClick={() => setLeftPanel('bookmarks')}>
        <Icon name="bookmark" size={18} />
      </button>
      <button className="wo-advanced-action" title="Nota diária" onClick={() => openDailyNote()}>
        <Icon name="calendar" size={18} />
      </button>
      <button className={`wo-advanced-action ${leftPanel === 'tags' ? 'ativo' : ''}`} title="Etiquetas" onClick={() => setLeftPanel('tags')}>
        <Icon name="hash" size={18} />
      </button>
      <button className="wo-advanced-action" title="Paleta de comandos (⌘P)" onClick={() => setPalette(true, 'commands')}>
        <Icon name="command" size={18} />
      </button>
      <button title="Atalhos e ajuda (F1)" aria-label="Atalhos e ajuda" onClick={() => window.dispatchEvent(new Event('wo-show-shortcuts'))}>
        <Icon name="command" size={18} />
      </button>
      <div className="spacer" />
      {gitEnabled && (
        <button title={syncing ? 'Sincronizando…' : 'Sincronizar agora'} onClick={sync} disabled={syncing}>
          <Icon name="refresh-cw" size={18} style={syncing ? { animation: 'spin 1s linear infinite' } : undefined} />
        </button>
      )}
      <button className="wo-advanced-action" title="Alternar tema" onClick={onTheme}>
        <Icon name="moon" size={18} />
      </button>
      <button title="Configurações" onClick={() => setSettings(true)}>
        <Icon name="settings" size={18} />
      </button>
    </div>
  );
}
