import test from 'node:test';
import assert from 'node:assert/strict';
import { createRevisionGuard, revisionOfText } from '../server/dist/services/guardedWrites.js';

test('revisão SHA-256 consistente inclusive com Unicode PT-BR', () => {
  assert.equal(revisionOfText('área de notas'), revisionOfText('área de notas'));
  assert.notEqual(revisionOfText('Nota original'), revisionOfText('Nota alterada'));
  assert.equal(revisionOfText(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});

test('edição concorrente não substitui silenciosamente versão mais recente', async () => {
  const mem = new Map([['teste.md', 'original']]);
  const save = createRevisionGuard(
    async p => { if (!mem.has(p)) throw Object.assign(new Error('ENOENT'), {code: 'ENOENT'}); return mem.get(p); },
    async (p, text) => { await new Promise(resolve => setTimeout(resolve, 5)); mem.set(p, text); },
  );
  const initial = revisionOfText('original');
  const pair = await Promise.allSettled([
    save('teste.md', 'edição do Windows', initial),
    save('teste.md', 'edição do iPhone', initial),
  ]);
  assert.equal(pair.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(pair.filter(x => x.status === 'rejected').length, 1);
  assert.equal(pair.find(x => x.status === 'rejected').reason.status, 409);
  assert.equal(mem.get('teste.md'), 'edição do Windows');
});

test('revisão incorreta e arquivo removido são rejeitados', async () => {
  const save = createRevisionGuard(async () => { throw Object.assign(new Error('ENOENT'), {code:'ENOENT'}); }, async () => {});
  await assert.rejects(save('nota.md', 'texto', 'abc'), {status:400});
  await assert.rejects(save('nota.md', 'texto', revisionOfText('antes')), {status:409});
});

test('edição aceita após recarregar a revisão atual', async () => {
  const mem = new Map([['nota.md','versão um']]);
  const save = createRevisionGuard(async p => mem.get(p), async (p,s) => {mem.set(p,s);});
  let rev = await save('nota.md', 'versão dois', revisionOfText('versão um'));
  assert.equal(rev, revisionOfText('versão dois'));
  rev = await save('nota.md', 'versão três', rev);
  assert.equal(mem.get('nota.md'),'versão três');
});
