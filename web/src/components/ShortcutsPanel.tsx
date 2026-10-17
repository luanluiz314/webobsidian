import { useMemo, useState } from 'react';

type Shortcut = { keys: string; name: string; description: string };
type Group = { title: string; entries: Shortcut[] };

const GROUPS: Group[] = [
  { title: 'Arquivos e navegação', entries: [
    { keys: 'Mod+N', name: 'Nova nota', description: 'Cria uma nota no cofre.' },
    { keys: 'Mod+O', name: 'Abrir nota', description: 'Procura e abre um arquivo do cofre.' },
    { keys: 'Mod+P', name: 'Paleta de comandos', description: 'Mostra os comandos disponíveis.' },
    { keys: 'Mod+S', name: 'Salvar', description: 'Salva as alterações da nota aberta.' },
    { keys: 'Mod+E', name: 'Alternar leitura', description: 'Muda entre leitura e edição.' },
    { keys: 'Mod+Shift+F', name: 'Pesquisar no cofre', description: 'Abre a busca na barra lateral.' },
    { keys: 'Mod+\\', name: 'Barra lateral', description: 'Mostra ou oculta o painel de arquivos.' },
    { keys: 'F1', name: 'Ajuda e atalhos', description: 'Abre esta área de referência.' },
  ] },
  { title: 'Edição e formatação', entries: [
    { keys: 'Mod+B', name: 'Negrito', description: 'Formata o texto selecionado em negrito.' },
    { keys: 'Mod+I', name: 'Itálico', description: 'Aplica itálico ao texto selecionado.' },
    { keys: 'Mod+K', name: 'Inserir link', description: 'Insere um link Markdown.' },
    { keys: 'Mod+L', name: 'Lista de tarefas', description: 'Marca ou desmarca um item de tarefa.' },
    { keys: 'Mod+D', name: 'Excluir parágrafo', description: 'Remove o parágrafo atual. Use com cuidado.' },
    { keys: 'Mod+/', name: 'Comentário', description: 'Adiciona ou remove marcação de comentário.' },
    { keys: 'Alt+Enter', name: 'Abrir link', description: 'Segue o link localizado sob o cursor.' },
  ] },
];

export default function ShortcutsPanel() {
  const [query, setQuery] = useState('');
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const groups = useMemo(() => GROUPS.map((group) => ({
    ...group,
    entries: group.entries.filter((entry) =>
      `${entry.name} ${entry.description} ${entry.keys}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR').trim()),
    ),
  })).filter((group) => group.entries.length > 0), [query]);
  const keysFor = (keys: string) => keys.replace('Mod', isMac ? '⌘' : 'Ctrl').split('+');

  return (
    <div className="wo-shortcuts">
      <div className="wo-section-heading">
        <div>
          <h2>Atalhos e ajuda</h2>
          <p>Descubra o que cada comando faz. No celular, use os botões na barra de ferramentas e no menu rápido.</p>
        </div>
        <span className="wo-shortcuts-hint">F1</span>
      </div>
      <label className="wo-shortcuts-search-label" htmlFor="wo-shortcuts-search">Pesquisar um atalho</label>
      <input
        id="wo-shortcuts-search"
        type="search"
        className="wo-shortcuts-search"
        placeholder="Ex.: salvar, nova nota, negrito…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {groups.length === 0 && <p className="wo-no-shortcuts">Nenhum atalho encontrado.</p>}
      {groups.map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h3>{group.title}</h3>
          <div className="wo-shortcut-list">
            {group.entries.map((entry) => (
              <div className="wo-shortcut-item" key={entry.keys}>
                <div className="wo-shortcut-detail">
                  <strong>{entry.name}</strong>
                  <span>{entry.description}</span>
                </div>
                <div className="wo-shortcut-keys" aria-label={entry.keys}>
                  {keysFor(entry.keys).map((key, i) => <kbd key={`${entry.keys}-${i}`}>{key}</kbd>)}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="wo-mobile-help">
        <strong>No iPhone</strong>
        <p>Abra o menu de arquivos no canto superior esquerdo. Toque no botão + para criar uma nota. Use a barra inferior para negrito, listas, links e outras formatações. Deslize a barra horizontalmente para ver mais opções.</p>
      </div>
    </div>
  );
}
