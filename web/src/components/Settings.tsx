import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { api } from '../lib/api';
import Icon from './Icon';
import ShortcutsPanel from './ShortcutsPanel';
import InterfacePreferences from './InterfacePreferences';

type Section = 'vault' | 'git' | 'api' | 'sharing' | 'plugins' | 'appearance' | 'account' | 'interface' | 'shortcuts' | 'about';

export default function Settings() {
  const open = useStore((s) => s.settingsOpen);
  const setOpen = useStore((s) => s.setSettings);
  const [section, setSection] = useState<Section>('vault');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (open) api.getSettings().then(setSettings).catch(() => {});
  }, [open]);

  useEffect(() => {
    const show = () => { setSection('shortcuts'); setOpen(true); };
    window.addEventListener('wo-show-shortcuts', show);
    return () => window.removeEventListener('wo-show-shortcuts', show);
  }, [setOpen]);

  if (!open) return null;

  return (
    <div className="modal-bg" onClick={() => setOpen(false)}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-layout">
          <div className="settings-nav">
            {(['interface', 'vault', 'appearance', 'shortcuts', 'git', 'api', 'sharing', 'plugins', 'account', 'about'] as Section[]).map((s) => (
              <button key={s} className={section === s ? 'ativo' : ''} onClick={() => setSection(s)}>
                {labels[s]}
              </button>
            ))}
          </div>
          <div className="settings-content">
            {settings && section === 'vault' && <VaultSettings s={settings} reload={() => api.getSettings().then(setSettings)} />}
            {settings && section === 'git' && <GitSettings s={settings} reload={() => api.getSettings().then(setSettings)} />}
            {section === 'api' && <ApiKeys />}
            {section === 'sharing' && <Shares />}
            {section === 'plugins' && <Plugins />}
            {settings && section === 'appearance' && <Appearance s={settings} />}
            {section === 'account' && <AccountSettings s={settings} reload={() => api.getSettings().then(setSettings)} />}
            {section === 'interface' && <InterfacePreferences />}
            {section === 'shortcuts' && <ShortcutsPanel />}
            {section === 'about' && <About />}
          </div>
        </div>
      </div>
    </div>
  );
}

const labels: Record<Section, string> = {
  vault: 'Cofre e arquivos',
  git: 'Sincronização GitHub',
  api: 'Chaves de API',
  sharing: 'Compartilhamento',
  plugins: 'Plugins da comunidade',
  appearance: 'Aparência',
  account: 'Conta',
  interface: 'Interface',
  shortcuts: 'Atalhos',
  about: 'Sobre',
};

function Row({ name, desc, children }: { name: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="setting-row">
      <div className="info">
        <div className="name">{name}</div>
        {desc && <div className="desc">{desc}</div>}
      </div>
      <div className="control">{children}</div>
    </div>
  );
}

function VaultSettings({ s, reload }: { s: any; reload: () => void }) {
  const [path, setPath] = useState(s.vault.path);
  const [deleteMode, setDeleteMode] = useState(s.vault.deleteMode ?? 'trash');
  const [browser, setBrowser] = useState<any>(null);
  const save = async () => {
    await api.putSettings({ vault: { path } });
    await reload();
    alert('Caminho do cofre salvo. Se necessário, reindexe pela paleta de comandos.');
  };
  const saveDeleteMode = async (mode: string) => {
    setDeleteMode(mode);
    await api.putSettings({ vault: { deleteMode: mode } });
    await reload();
  };
  const browse = async (dir?: string) => setBrowser(await api.browse(dir).catch((e) => ({ error: e.message })));
  return (
    <div>
      <h2>Cofre e arquivos</h2>
      <Row name="Caminho do cofre" desc="Caminho absoluto da pasta de notas no servidor">
        <input className="text-input" style={{ width: 260 }} value={path} onChange={(e) => setPath(e.target.value)} />
      </Row>
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        <button className="btn secondary" onClick={() => browse()}>Procurar…</button>
        <button className="btn" onClick={save}>Salvar caminho do cofre</button>
      </div>
      {browser && !browser.error && (
        <div style={{ border: '1px solid var(--bg-modifier-border)', borderRadius: 6, padding: 8, marginTop: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{browser.dir}</div>
          <div className="result" onClick={() => browse(browser.parent)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="folder" size={15} /> ..
          </div>
          {browser.folders.map((f: any) => (
            <div className="result" key={f.path} onClick={() => browse(f.path)} onDoubleClick={() => setPath(f.path)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="folder" size={15} /> {f.name}
              <button className="btn secondary" style={{ float: 'right', padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); setPath(f.path); }}>
                Selecionar
              </button>
            </div>
          ))}
        </div>
      )}
      {browser?.error && <div style={{ color: '#e5534b' }}>{browser.error}</div>}
      <Row
        name="Ao excluir um arquivo"
        desc="Mover para .trash preserva uma cópia recuperável. A exclusão permanente remove o arquivo imediatamente."
      >
        <select
          className="text-input"
          style={{ width: 220 }}
          value={deleteMode}
          onChange={(e) => saveDeleteMode(e.target.value)}
        >
          <option value="trash">Mover para .trash (recuperável)</option>
          <option value="permanent">Excluir permanentemente</option>
        </select>
      </Row>
    </div>
  );
}

function GitSettings({ s, reload }: { s: any; reload: () => void }) {
  const [g, setG] = useState({ ...s.git });
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLTextAreaElement>(null);
  const set = (k: string, v: any) => setG((p: any) => ({ ...p, [k]: v }));
  // Append timestamped lines to the running log instead of replacing it, so the
  // textarea keeps a history of every git action across clicks.
  const append = (lines: string[]) => {
    const ts = new Date().toLocaleTimeString();
    setLog((prev) => [...prev, ...lines.map((l, i) => (i === 0 ? `[${ts}] ${l}` : `         ${l}`))]);
  };
  // Auto-scroll to the newest line whenever the log grows.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);
  const save = async () => { await api.putSettings({ git: g }); await reload(); append(['Saved git settings']); };
  const run = async (fn: () => Promise<any>, label: string) => {
    append([`${label}…`]);
    try {
      const r = await fn();
      // sync returns { ok, log: string[] }; others return { message }. Split any
      // embedded newlines so multi-line git output renders one line per row.
      const lines: string[] = Array.isArray(r?.log)
        ? [`${label} ${r.ok ? 'ok' : 'NOT ok'}`, ...r.log]
        : [String(r?.message ?? JSON.stringify(r))];
      append(lines.flatMap((l) => String(l).split('\n')));
    } catch (e: any) { append([`Erro: ${e.message}`]); }
  };
  return (
    <div>
      <h2>Sincronização GitHub</h2>
      <Row name="Ativar sincronização Git"><input type="checkbox" checked={g.enabled} onChange={(e) => set('ativado', e.target.checked)} /></Row>
      <Row name="URL remota" desc="https://github.com/owner/repo.git">
        <input className="text-input" style={{ width: 260 }} value={g.remote} onChange={(e) => set('remote', e.target.value)} />
      </Row>
      <Row name="Branch"><input className="text-input" style={{ width: 120 }} value={g.branch} onChange={(e) => set('branch', e.target.value)} /></Row>
      <Row name="Token de acesso (PAT)" desc="Armazenado no servidor; deixe mascarado para manter o atual">
        <input className="text-input" type="password" style={{ width: 260 }} value={g.token} onChange={(e) => set('token', e.target.value)} />
      </Row>
      <Row name="Nome do autor"><input className="text-input" value={g.authorName} onChange={(e) => set('authorName', e.target.value)} /></Row>
      <Row name="E-mail do autor"><input className="text-input" value={g.authorEmail} onChange={(e) => set('authorEmail', e.target.value)} /></Row>
      <Row name="Sincronização automática" desc="Baixar, registrar e enviar alterações periodicamente no intervalo abaixo"><input type="checkbox" checked={g.autoSync} onChange={(e) => set('autoSync', e.target.checked)} /></Row>
      <Row name="Registrar alterações ao salvar" desc="Registra e envia alterações cerca de 5 s após cada edição"><input type="checkbox" checked={g.autoCommitOnSave} onChange={(e) => set('autoCommitOnSave', e.target.checked)} /></Row>
      <Row name="Intervalo (s)"><input className="text-input" type="number" style={{ width: 90 }} value={g.intervalSec} onChange={(e) => set('intervalSec', Number(e.target.value))} /></Row>
      <Row name="Padrões Git LFS" desc="Padrões separados por espaço, rastreados pelo LFS">
        <input className="text-input" style={{ width: 260 }} value={(g.lfsPatterns || []).join(' ')} onChange={(e) => set('lfsPatterns', e.target.value.split(/\s+/).filter(Boolean))} />
      </Row>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button className="btn" onClick={save}>Salvar</button>
        <button className="btn secondary" onClick={() => run(api.gitInit, 'Init')}>Inicializar repositório</button>
        <button className="btn secondary" onClick={() => run(api.gitClone, 'Clonar')}>Clonar</button>
        <button className="btn secondary" onClick={() => run(api.gitPull, 'Baixar alterações')}>Baixar alterações</button>
        <button className="btn secondary" onClick={() => run(() => api.gitCommit(), 'Registrar alterações')}>Registrar alterações</button>
        <button className="btn secondary" onClick={() => run(api.gitPush, 'Enviar alterações')}>Enviar alterações</button>
        <button className="btn" onClick={() => run(() => api.gitSync(), 'Sync')}>Sincronizar agora</button>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Registro de sincronização</span>
          {log.length > 0 && (
            <button className="btn secondary" style={{ padding: '2px 8px' }} onClick={() => setLog([])}>Limpar</button>
          )}
        </div>
        <textarea
          ref={logRef}
          readOnly
          value={log.length ? log.join('\n') : 'Nenhuma atividade Git ainda. Clique em uma ação acima para exibir os registros.'}
          style={{
            width: '100%', height: 200, boxSizing: 'border-box', resize: 'vertical',
            background: 'var(--bg-primary)', color: 'var(--text-normal)',
            border: '1px solid var(--bg-modifier-border, #444)', borderRadius: 6, padding: 10,
            fontFamily: 'var(--font-monospace, monospace)', fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre',
          }}
        />
      </div>
    </div>
  );
}

function ApiKeys() {
  const [keys, setKeys] = useState<any[]>([]);
  const [name, setName] = useState('my-agent');
  const [scopes, setScopes] = useState<string[]>(['read', 'search']);
  const [created, setCreated] = useState('');
  const load = () => api.listKeys().then((r) => setKeys(r.keys)).catch(() => {});
  useEffect(() => { load(); }, []);
  const toggle = (sc: string) => setScopes((p) => (p.includes(sc) ? p.filter((x) => x !== sc) : [...p, sc]));
  const create = async () => {
    const r = await api.createKey(name, scopes);
    setCreated(r.key);
    await load();
  };
  return (
    <div>
      <h2>Chaves de API</h2>
      <p style={{ color: 'var(--text-muted)' }}>As chaves permitem que agentes de IA acessem <code>/api/v1</code>. The raw key is shown once.</p>
      <Row name="Nome"><input className="text-input" value={name} onChange={(e) => setName(e.target.value)} /></Row>
      <Row name="Permissões">
        <span>
          {['read', 'write', 'search'].map((sc) => (
            <label key={sc} style={{ marginRight: 10 }}>
              <input type="checkbox" checked={scopes.includes(sc)} onChange={() => toggle(sc)} /> {sc}
            </label>
          ))}
        </span>
      </Row>
      <button className="btn" onClick={create}>Criar chave</button>
      {created && (
        <pre style={{ background: 'var(--bg-primary)', padding: 10, borderRadius: 6, marginTop: 10, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
          {created}
          {'\n'}⚠ Copy now — it will not be shown again.
        </pre>
      )}
      <div style={{ marginTop: 16 }}>
        {keys.map((k) => (
          <div className="setting-row" key={k.id}>
            <div className="info">
              <div className="name">{k.name} <span style={{ color: 'var(--text-faint)' }}>{k.prefix}…</span></div>
              <div className="desc">permissões: {k.scopes.join(', ')} · used: {k.lastUsed ?? 'nunca'}</div>
            </div>
            <button className="btn danger" onClick={async () => { await api.revokeKey(k.id); load(); }}>Revogar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Shares() {
  const notify = useStore((s) => s.notify);
  const openFile = useStore((s) => s.openFile);
  const setOpen = useStore((s) => s.setSettings);
  // Shared with the store so the file tree's globe badges refresh on changes.
  const shares = useStore((s) => s.shares);
  const load = useStore((s) => s.loadShares);
  const [query, setQuery] = useState('');
  useEffect(() => { load(); }, [load]);

  const url = (id: string) => `${location.origin}/share/${id}`;
  const copy = (id: string) => {
    navigator.clipboard?.writeText(url(id)).catch(() => {});
    notify('Link público copiado');
  };
  const toggle = async (s: any) => {
    await api.setShareEnabled(s.id, !s.enabled);
    load();
  };
  const remove = async (s: any) => {
    if (!confirm(`Delete the public link for "${s.path}"? The URL stops working permanently.`)) return;
    await api.deleteShare(s.id);
    load();
  };
  const setPassword = async (s: any) => {
    const pw = prompt(
      s.hasPassword
        ? 'New password for this link (leave empty to REMOVE the password):'
        : 'Password for this link:',
    );
    if (pw === null) return;
    await api.setSharePassword(s.id, pw || null);
    notify(pw ? 'Senha definida' : 'Senha removida');
    load();
  };

  const q = query.trim().toLowerCase();
  const filtered = q ? shares.filter((s) => s.path.toLowerCase().includes(q)) : shares;

  return (
    <div>
      <h2>Compartilhamento</h2>
      <p style={{ color: 'var(--text-muted)' }}>
        Notas compartilhadas por link público podem ser lidas por <b>qualquer pessoa com a URL</b>, without login.
        Create a link from a note's context menu ("Share…"). Disable keeps the URL for
        re-enabling later; delete revokes it permanently.
      </p>
      <input
        className="text-input"
        style={{ width: '100%', margin: '6px 0 12px' }}
        placeholder="Pesquisar notas compartilhadas…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {filtered.length === 0 && (
        <div style={{ color: 'var(--text-faint)' }}>
          {shares.length === 0 ? 'Nenhuma nota compartilhada publicamente.' : 'Nenhuma nota compartilhada corresponde à pesquisa.'}
        </div>
      )}
      {filtered.map((s) => (
        <div className="setting-row" key={s.id}>
          <div className="info" style={{ minWidth: 0 }}>
            <div
              className="name"
              style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: s.enabled ? 1 : 0.55 }}
              title={`Open ${s.path}`}
              onClick={() => { openFile(s.path); setOpen(false); }}
            >
              {s.path}
            </div>
            <div className="desc">
              {s.enabled ? 'ativo' : 'desativado'}
              {s.hasPassword ? ' · password-protected' : ''} · created {new Date(s.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button className="btn secondary" disabled={!s.enabled} onClick={() => copy(s.id)} title={url(s.id)}>
              <Icon name="link" size={14} /> Copiar link
            </button>
            <button className="btn secondary" onClick={() => setPassword(s)} title={s.hasPassword ? 'Alterar ou remover senha' : 'Exigir senha para abrir o link'}>
              {s.hasPassword ? 'Password ✓' : 'Senha…'}
            </button>
            <button className={`btn ${s.enabled ? 'secondary' : ''}`} onClick={() => toggle(s)}>
              {s.enabled ? 'Desativar' : 'Ativar'}
            </button>
            <button className="btn danger" onClick={() => remove(s)}>Excluir</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Plugins() {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [repo, setRepo] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => api.listPlugins().then((r) => setPlugins(r.plugins)).catch(() => {});
  useEffect(() => { load(); }, []);
  const install = async () => {
    setMsg('Instalando…');
    try { await api.installPlugin(repo); setMsg('Instalado ✓'); setRepo(''); await load(); }
    catch (e: any) { setMsg(`Erro: ${e.message}`); }
  };
  return (
    <div>
      <h2>Plugins da comunidade</h2>
      <Row name="Instalar pelo GitHub" desc="owner/repo — pulls manifest.json + main.js from latest release">
        <span style={{ display: 'flex', gap: 8 }}>
          <input className="text-input" placeholder="blacksmithgu/obsidian-dataview" value={repo} onChange={(e) => setRepo(e.target.value)} />
          <button className="btn" onClick={install}>Instalar</button>
        </span>
      </Row>
      {msg && <div style={{ color: 'var(--text-muted)', margin: '6px 0' }}>{msg}</div>}
      <div style={{ marginTop: 12 }}>
        {plugins.length === 0 && <div style={{ color: 'var(--text-faint)' }}>Nenhum plugin instalado em .obsidian/plugins</div>}
        {plugins.map((p) => (
          <div className="setting-row" key={p.id}>
            <div className="info">
              <div className="name">{p.name} <span style={{ color: 'var(--text-faint)' }}>v{p.version}</span></div>
              <div className="desc">{p.description}</div>
            </div>
            <label>
              <input type="checkbox" checked={p.enabled} onChange={async (e) => { await api.setPluginEnabled(p.id, e.target.checked); load(); }} /> ativado
            </label>
          </div>
        ))}
      </div>
      <p style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 14 }}>
        Note: WebObsidian supports a subset of the Obsidian plugin API. Most metadata/markdown plugins work; plugins relying on Electron/Node internals may not.
      </p>
    </div>
  );
}

function Appearance({ s }: { s: any }) {
  const [theme, setTheme] = useState(s.ui.theme);
  const save = async (t: string) => { setTheme(t); await api.putSettings({ ui: { theme: t } }); location.reload(); };
  return (
    <div>
      <h2>Aparência</h2>
      <Row name="Tema">
        <select className="text-input" value={theme} onChange={(e) => save(e.target.value)}>
          <option value="obsidian-dark">Obsidian Escuro</option>
          <option value="obsidian-light">Obsidian Claro</option>
        </select>
      </Row>
    </div>
  );
}

function AccountSettings({ s, reload }: { s: any; reload: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const usingDefault = !s?.auth?.hasCustomPassword;

  const save = async () => {
    setErr('');
    setMsg('');
    if (next.length < 6) {
      setErr('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (next !== confirm) {
      setErr('A confirmação da senha não coincide');
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(current, next);
      setMsg('Senha alterada ✓');
      setCurrent('');
      setNext('');
      setConfirm('');
      await reload();
    } catch (e: any) {
      setErr(e?.message ?? 'Falha ao alterar a senha');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>Conta</h2>
      <p style={{ color: 'var(--text-muted)' }}>
        Senha de acesso ao WebObsidian.
        {usingDefault && (
          <>
            {' '}Bạn đang dùng <b>senha padrão <code>123456</code></b> — hãy đổi mật khẩu để
            bảo mật vault.
          </>
        )}
      </p>
      <Row name="Senha atual" desc={usingDefault ? 'Padrão: 123456' : undefined}>
        <input className="text-input" type="password" style={{ width: 240 }} value={current}
          onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
      </Row>
      <Row name="Nova senha" desc="Mínimo de 6 caracteres">
        <input className="text-input" type="password" style={{ width: 240 }} value={next}
          onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
      </Row>
      <Row name="Confirmar nova senha">
        <input className="text-input" type="password" style={{ width: 240 }} value={confirm}
          onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </Row>
      {err && <div style={{ color: '#e5534b', margin: '6px 0' }}>{err}</div>}
      {msg && <div style={{ color: 'var(--text-accent, #4caf50)', margin: '6px 0' }}>{msg}</div>}
      <button className="btn" onClick={save} disabled={busy || !current || !next}>
        {busy ? 'Salvando…' : 'Alterar senha'}
      </button>
      <p style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 16 }}>
        Esqueceu a senha? Defina <code>auth.passwordHash</code> trong <code>data/settings.json</code> hoặc
        biến môi trường <code>WEBOBSIDIAN_PASSWORD</code> làm mật khẩu khôi phục (override) rồi đăng
        nhập lại để đổi mật khẩu mới.
      </p>
    </div>
  );
}

function About() {
  const logout = async () => { await api.logout(); location.reload(); };
  return (
    <div>
      <h2>Sobre o WebObsidian</h2>
      <p style={{ color: 'var(--text-muted)' }}>
        A self-hosted, Obsidian-compatible web app. Vault, QMD search, GitHub sync (with LFS),
        agent API and community plugins.
      </p>
      <button className="btn danger" onClick={logout}>Sair</button>
    </div>
  );
}
