import { useEffect } from 'react';
import { useStore } from '../lib/store';
import { api } from '../lib/api';
import Icon from './Icon';

/**
 * Per-note share settings popup (FR-10) — opened from the file-tree context
 * menu ("Share…"). Create/copy the public URL, toggle it on/off, manage the
 * password, or delete the link. The centralized list lives in Settings → Sharing.
 */
export default function ShareDialog() {
  const path = useStore((s) => s.shareDialogPath);
  const setShareDialog = useStore((s) => s.setShareDialog);
  const shares = useStore((s) => s.shares);
  const loadShares = useStore((s) => s.loadShares);
  const notify = useStore((s) => s.notify);

  useEffect(() => {
    if (path) loadShares();
  }, [path, loadShares]);

  if (!path) return null;
  const close = () => setShareDialog(null);
  const share = shares.find((s) => s.path === path) ?? null;
  const url = share ? `${location.origin}/share/${share.id}` : '';

  const create = async () => {
    await api.createShare(path);
    await loadShares();
    notify('Link público criado');
  };
  const toggle = async () => {
    if (!share) return;
    await api.setShareEnabled(share.id, !share.enabled);
    await loadShares();
  };
  const copy = () => {
    navigator.clipboard?.writeText(url).catch(() => {});
    notify('Link público copiado');
  };
  const password = async () => {
    if (!share) return;
    const pw = prompt(
      share.hasPassword
        ? 'New password for this link (leave empty to REMOVE the password):'
        : 'Password for this link:',
    );
    if (pw === null) return;
    await api.setSharePassword(share.id, pw || null);
    await loadShares();
    notify(pw ? 'Senha definida' : 'Senha removida');
  };
  const remove = async () => {
    if (!share) return;
    if (!confirm('Excluir este link público? A URL deixará de funcionar definitivamente.')) return;
    await api.deleteShare(share.id);
    await loadShares();
    notify('Link público excluído');
  };

  return (
    <div className="modal-bg" onClick={close}>
      <div className="modal share-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="share-dialog-head">
          <Icon name="globe" size={18} />
          <div>
            <div className="share-dialog-title">{/\.canvas$/i.test(path) ? 'Share canvas' : 'Share note'}</div>
            <div className="share-dialog-path">{path}</div>
          </div>
        </div>

        {!share && (
          <>
            <p className="share-dialog-hint">
              Crie um link público para que <b>qualquer pessoa com a URL</b> possa ler esta nota sem entrar na conta.
            </p>
            <button className="btn" onClick={create}>
              <Icon name="globe" size={14} /> Criar link público
            </button>
          </>
        )}

        {share && (
          <>
            <div className="setting-row">
              <div className="info">
                <div className="name">Link público</div>
                <div className="desc">{share.enabled ? 'Anyone with the URL can view this note' : 'Sharing is paused — the URL returns 404'}</div>
              </div>
              <button className={`graph-switch ${share.enabled ? 'on' : ''}`} onClick={toggle} aria-label="Ativar/desativar link público">
                <span className="graph-knob" />
              </button>
            </div>

            {share.enabled && (
              <div className="share-url">
                <input className="text-input" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
                <button className="btn" onClick={copy}><Icon name="link" size={14} /> Copiar</button>
              </div>
            )}

            <div className="setting-row">
              <div className="info">
                <div className="name">Proteção por senha</div>
                <div className="desc">{share.hasPassword ? 'Visitors must enter a password' : 'Anyone with the link can open it'}</div>
              </div>
              <button className="btn secondary" onClick={password}>
                {share.hasPassword ? 'Change…' : 'Set password…'}
              </button>
            </div>

            <div className="setting-row">
              <div className="info">
                <div className="name">Excluir link</div>
                <div className="desc">Revoga a URL permanentemente</div>
              </div>
              <button className="btn danger" onClick={remove}>Excluir</button>
            </div>
          </>
        )}

        <div className="share-dialog-foot">
          <button className="btn secondary" onClick={close}>Concluído</button>
        </div>
      </div>
    </div>
  );
}
