/**
 * Salvamento condicional por revisão, independente dos internals do Obsidian.
 * Impede que duas requisições do mesmo processo sobreponham silenciosamente
 * uma nota editada por sessões diferentes.
 *
 * Limites: não é um lock distribuído, nem um merge automático. Uma escrita fora
 * deste endpoint (p.ex. acesso direto ao volume) não participa desta fila.
 */
import { createHash } from 'node:crypto';
import { readFileText, writeFileText } from './vault.js';

export const revisionOfText = (content: string): string =>
  createHash('sha256').update(content, 'utf8').digest('hex');

export function createRevisionGuard(
  read: (path: string) => Promise<string>,
  write: (path: string, content: string) => Promise<void>,
) {
  const queues = new Map<string, Promise<void>>();
  return async function saveWithRevision(
    path: string,
    content: string,
    expectedRevision?: string,
  ): Promise<string> {
    if (expectedRevision !== undefined && !/^[a-f0-9]{64}$/i.test(expectedRevision)) {
      throw Object.assign(new Error('Revisão inválida'), { status: 400 });
    }
    const prior = queues.get(path) ?? Promise.resolve();
    const current = prior.then(async () => {
      if (expectedRevision !== undefined) {
        let saved: string;
        try {
          saved = await read(path);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            throw Object.assign(new Error('Nota removida ou renomeada em outra sessão'), { status: 409 });
          }
          throw error;
        }
        if (revisionOfText(saved) !== expectedRevision) {
          throw Object.assign(new Error('Esta nota mudou em outro dispositivo. Sua edição não foi sobrescrita.'), { status: 409 });
        }
      }
      await write(path, content);
      return revisionOfText(content);
    });
    const settled = current.then(() => undefined, () => undefined);
    queues.set(path, settled);
    try {
      return await current;
    } finally {
      if (queues.get(path) === settled) queues.delete(path);
    }
  };
}

export const guardedWriteText = createRevisionGuard(readFileText, writeFileText);
