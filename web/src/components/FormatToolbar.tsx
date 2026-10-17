import { useEffect, useState } from 'react';
import Icon from './Icon';
import type { IconName } from './Icon';
import {
  fmtInline,
  fmtChecklist,
  fmtPrefixLines,
  fmtInsert,
  fmtLink,
  fmtIndent,
  fmtOutdent,
  fmtUndo,
  fmtRedo,
} from '../lib/activeEditor';

type Btn = { icon: IconName; title: string; run: () => void };

const BUTTONS: Btn[] = [
  { icon: 'heading', title: 'Título', run: () => fmtPrefixLines('# ') },
  { icon: 'bold', title: 'Negrito', run: () => fmtInline('**') },
  { icon: 'italic', title: 'Itálico', run: () => fmtInline('*') },
  { icon: 'list', title: 'Lista com marcadores', run: () => fmtPrefixLines('- ') },
  { icon: 'check-square', title: 'Lista de tarefas', run: () => fmtChecklist() },
  { icon: 'quote', title: 'Citação', run: () => fmtPrefixLines('> ') },
  { icon: 'brackets', title: 'Link interno', run: () => fmtInsert('[[]]', 2) },
  { icon: 'link', title: 'Inserir link', run: () => fmtLink() },
  { icon: 'code', title: 'Código em linha', run: () => fmtInline('`') },
  { icon: 'hash', title: 'Etiqueta', run: () => fmtInsert('#') },
  { icon: 'indent-increase', title: 'Aumentar recuo', run: () => fmtIndent() },
  { icon: 'indent-decrease', title: 'Diminuir recuo', run: () => fmtOutdent() },
  { icon: 'undo', title: 'Desfazer', run: () => fmtUndo() },
  { icon: 'redo', title: 'Refazer', run: () => fmtRedo() },
];

function Buttons({ size }: { size: number }) {
  return (
    <>
      {BUTTONS.map((b) => (
        <button
          key={b.title}
          title={b.title}
          aria-label={b.title}
          // Keep the editor focused / the keyboard open when a button is pressed.
          onPointerDown={(e) => e.preventDefault()}
          onClick={b.run}
        >
          <Icon name={b.icon} size={size} />
        </button>
      ))}
    </>
  );
}

/**
 * Markdown formatting toolbar (Obsidian Mobile-style). Two layouts:
 * - mobile: fixed above the on-screen keyboard (anchored via the visual viewport,
 *   since iOS Safari doesn't reflow fixed elements for the keyboard).
 * - desktop: an in-flow strip rendered right under the view header.
 */
export default function FormatToolbar({ mobile = false }: { mobile?: boolean }) {
  const [bottom, setBottom] = useState(0);

  useEffect(() => {
    if (!mobile) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      // Gap between the layout-viewport bottom and the visual-viewport bottom =
      // height of the on-screen keyboard (0 when hidden).
      const gap = window.innerHeight - (vv.height + vv.offsetTop);
      setBottom(Math.max(0, gap));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [mobile]);

  if (mobile) {
    return (
      <div className="mobile-toolbar" style={{ bottom }}>
        <Buttons size={20} />
      </div>
    );
  }
  return (
    <div className="format-toolbar">
      <Buttons size={16} />
    </div>
  );
}
