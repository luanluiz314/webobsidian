import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStore } from '../lib/store';
import Icon from './Icon';

export default function Login({ onAuthed }: { onAuthed: () => void }) {
  const setMustChangePassword = useStore((s) => s.setMustChangePassword);
  const [needSetup, setNeedSetup] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.authStatus().then((s) => setNeedSetup(!s.passwordSet)).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (needSetup && password !== confirm) {
      setErr('As senhas não coincidem');
      return;
    }
    setBusy(true);
    try {
      if (needSetup) {
        await api.setup(password);
        setMustChangePassword(false); // a freshly-set password is already custom
      } else {
        const r = await api.login(password);
        setMustChangePassword(Boolean(r.mustChangePassword));
      }
      onAuthed();
    } catch (e: any) {
      setErr(e.message ?? 'Falhou');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="logo">
          <Icon name="gem" size={40} />
        </div>
        <h1>WebObsidian</h1>
        <p>{needSetup ? 'Defina uma senha mestra para proteger seu cofre' : 'Digite sua senha para desbloquear'}</p>
        <div className="err">{err}</div>
        <input
          className="text-input"
          type="password"
          placeholder="Senha"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {needSetup && (
          <input
            className="text-input"
            type="password"
            placeholder="Confirme a senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        )}
        <button className="btn" type="submit" disabled={busy}>
          {needSetup ? 'Criar e desbloquear' : 'Desbloquear'}
        </button>
      </form>
    </div>
  );
}
