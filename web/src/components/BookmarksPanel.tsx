import { useStore, type ContextMenuItem } from '../lib/store';
import { pathToUrl } from '../lib/urlsync';
import Icon from './Icon';

export default function BookmarksPanel() {
  const bookmarks = useStore((s) => s.bookmarks);
  const recent = useStore((s) => s.recent);
  const openFile = useStore((s) => s.openFile);
  const openToSide = useStore((s) => s.openToSide);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const removeRecent = useStore((s) => s.removeRecent);
  const revealInTree = useStore((s) => s.revealInTree);
  const setMovePath = useStore((s) => s.setMovePath);
  const openContextMenu = useStore((s) => s.openContextMenu);
  const notify = useStore((s) => s.notify);

  const name = (p: string) => p.split('/').pop()?.replace(/\.(md|markdown)$/, '') ?? p;

  const copyUrl = (p: string) => {
    navigator.clipboard?.writeText(`${location.origin}${pathToUrl(p)}`).catch(() => {});
    notify('URL copiada');
  };

  // Drag a row onto a folder in the file tree to move the underlying file
  // (FileTree's onDrop reads this same `text/wo-path` payload).
  const onDragStart = (e: React.DragEvent, path: string) => {
    e.dataTransfer.setData('text/wo-path', path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const showMenu = (e: React.MouseEvent, path: string, kind: 'bookmark' | 'recent') => {
    e.preventDefault();
    e.stopPropagation();
    const isBookmarked = bookmarks.includes(path);
    const items: ContextMenuItem[] = [
      { label: 'Abrir', icon: 'file-text', onClick: () => openFile(path) },
      { label: 'Abrir à direita', icon: 'columns', onClick: () => openToSide(path) },
      { label: '', separator: true },
      { label: 'Localizar arquivo na navegação', icon: 'folder', onClick: () => revealInTree(path) },
      { label: 'Mover arquivo para…', icon: 'folder', onClick: () => setMovePath(path) },
      { label: isBookmarked ? 'Remover dos favoritos' : 'Adicionar aos favoritos', icon: 'bookmark', onClick: () => toggleBookmark(path) },
      ...(kind === 'recent'
        ? [{ label: 'Remover dos recentes', icon: 'x', onClick: () => removeRecent(path) } as ContextMenuItem]
        : []),
      { label: 'Copiar caminho da URL', onClick: () => copyUrl(path) },
    ];
    openContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const actionBtn = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div>
      <div className="panel-title">Favoritos</div>
      {bookmarks.length === 0 && <div className="panel-item">Nenhum favorito ainda</div>}
      {bookmarks.map((b) => (
        <div
          key={b}
          className="panel-item"
          draggable
          onDragStart={(e) => onDragStart(e, b)}
          onClick={() => openFile(b)}
          onContextMenu={(e) => showMenu(e, b, 'bookmark')}
          title={b}
        >
          <Icon name="bookmark" size={14} /> <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name(b)}</span>
          <span className="panel-item-actions">
            <span title="Mover arquivo para…" onClick={(e) => actionBtn(e, () => setMovePath(b))}>
              <Icon name="folder" size={13} />
            </span>
            <span title="Remover dos favoritos" onClick={(e) => actionBtn(e, () => toggleBookmark(b))}>
              <Icon name="x" size={13} />
            </span>
          </span>
        </div>
      ))}
      <div className="panel-title" style={{ marginTop: 8 }}>Recentes</div>
      {recent.length === 0 && <div className="panel-item">Nenhum arquivo recente</div>}
      {recent.map((r) => (
        <div
          key={r}
          className="panel-item"
          draggable
          onDragStart={(e) => onDragStart(e, r)}
          onClick={() => openFile(r)}
          onContextMenu={(e) => showMenu(e, r, 'recent')}
          title={r}
        >
          <Icon name="clock" size={14} /> <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name(r)}</span>
          <span className="panel-item-actions">
            <span title="Mover arquivo para…" onClick={(e) => actionBtn(e, () => setMovePath(r))}>
              <Icon name="folder" size={13} />
            </span>
            <span title="Remover dos recentes" onClick={(e) => actionBtn(e, () => removeRecent(r))}>
              <Icon name="x" size={13} />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
