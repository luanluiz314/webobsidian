import { useState } from 'react';
import { api } from '../lib/api';
import { useStore } from '../lib/store';
import Icon from './Icon';

const MIN_LEN = 6;
const DEFAULT_PASSWORD = '123456';

/**
 * Blocking screen shown right after login when the account is still on the
 * default password (server reports `mustChangePassword`). The vault can't be
 * used until a custom password is set — there is no dismiss.
 */
export default function ForceChangePassword() {
  const setMustChangePassword = useStore((s) => s.setMustChangePassword);
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (next.length < MIN_LEN) {
      setErr(`A senha deve ter pelo menos ${MIN_LEN} caracteres`);
      return;
    }
    if (next === DEFAULT_PASSWORD) {
      setErr('Escolha uma senha diferente da padrão');
      return;
    }
    if (next !== confirm) {
      setErr('As senhas não coincidem');
      return;
    }
    setBusy(true);
    try {
      // Current password is the default; the server verifies it.
      await api.changePassword(DEFAULT_PASSWORD, next);
      setMustChangePassword(false);
    } catch (e: any) {
      setErr(e.message ?? 'Falha ao alterar a senha');
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
        <h1>Definir nova senha</h1>
        <p>
          You are signed in with the default password (<code>123456</code>). Choose a
          new password to secure your vault before continuing.
        </p>
        <div className="err">{err}</div>
        <input
          className="text-input"
          type="password"
          placeholder="Nova senha"
          autoFocus
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <input
          className="text-input"
          type="password"
          placeholder="Confirme a nova senha"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Salvando…' : 'Set password & continue'}
        </button>
      </form>
    </div>
  );
}
