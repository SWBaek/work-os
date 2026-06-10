import React, { useEffect, useState } from 'react';
import { Editor, useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Bold, Italic, List, ListOrdered, CheckSquare, Heading1, Heading2, Heading3, Code } from 'lucide-react';

interface MeetingNoteEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const inlineMarkdownToHtml = (value: string) =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

const markdownToHtml = (markdown: string) => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      closeList();
      html.push(`<h${heading[1].length}>${inlineMarkdownToHtml(heading[2])}</h${heading[1].length}>`);
      continue;
    }

    const item = /^[-*]\s+(\[[ xX]\]\s+)?(.+)$/.exec(trimmed);
    if (item) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      const checked = item[1]?.toLowerCase().includes('x') ?? false;
      const checkbox = item[1] ? `<label><input type="checkbox"${checked ? ' checked="checked"' : ''}> ${inlineMarkdownToHtml(item[2])}</label>` : inlineMarkdownToHtml(item[2]);
      html.push(`<li>${checkbox}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdownToHtml(trimmed)}</p>`);
  }

  closeList();
  return html.join('\n');
};

const htmlToMarkdown = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const renderNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (!(node instanceof HTMLElement)) return '';

    const children = Array.from(node.childNodes).map(renderNode).join('');
    if (node.tagName === 'STRONG' || node.tagName === 'B') return `**${children}**`;
    if (node.tagName === 'EM' || node.tagName === 'I') return `*${children}*`;
    if (node.tagName === 'CODE') return `\`${children}\``;
    if (node.tagName === 'H1') return `# ${children}\n\n`;
    if (node.tagName === 'H2') return `## ${children}\n\n`;
    if (node.tagName === 'H3') return `### ${children}\n\n`;
    if (node.tagName === 'P') return `${children}\n\n`;
    if (node.tagName === 'LI') {
      const checkbox = node.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      const marker = checkbox ? `[${checkbox.checked ? 'x' : ' '}] ` : '';
      return `- ${marker}${children.replace(/^\s+/, '')}\n`;
    }
    if (node.tagName === 'UL' || node.tagName === 'OL') return `${children}\n`;
    if (node.tagName === 'BR') return '\n';
    return children;
  };

  return Array.from(document.body.childNodes).map(renderNode).join('').replace(/\n{3,}/g, '\n\n').trim();
};

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface p-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`rounded p-1.5 hover:bg-surface-2 ${editor.isActive('heading', { level: 1 }) ? 'bg-surface-2 text-primary' : 'text-muted-foreground'}`}
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`rounded p-1.5 hover:bg-surface-2 ${editor.isActive('heading', { level: 2 }) ? 'bg-surface-2 text-primary' : 'text-muted-foreground'}`}
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`rounded p-1.5 hover:bg-surface-2 ${editor.isActive('heading', { level: 3 }) ? 'bg-surface-2 text-primary' : 'text-muted-foreground'}`}
      >
        <Heading3 className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-border mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`rounded p-1.5 hover:bg-surface-2 ${editor.isActive('bold') ? 'bg-surface-2 text-primary' : 'text-muted-foreground'}`}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`rounded p-1.5 hover:bg-surface-2 ${editor.isActive('italic') ? 'bg-surface-2 text-primary' : 'text-muted-foreground'}`}
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`rounded p-1.5 hover:bg-surface-2 ${editor.isActive('code') ? 'bg-surface-2 text-primary' : 'text-muted-foreground'}`}
      >
        <Code className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-border mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded p-1.5 hover:bg-surface-2 ${editor.isActive('bulletList') ? 'bg-surface-2 text-primary' : 'text-muted-foreground'}`}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`rounded p-1.5 hover:bg-surface-2 ${editor.isActive('orderedList') ? 'bg-surface-2 text-primary' : 'text-muted-foreground'}`}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`rounded p-1.5 hover:bg-surface-2 ${editor.isActive('taskList') ? 'bg-surface-2 text-primary' : 'text-muted-foreground'}`}
      >
        <CheckSquare className="h-4 w-4" />
      </button>
    </div>
  );
};

export const MeetingNoteEditor: React.FC<MeetingNoteEditorProps> = ({ initialContent, onChange, readOnly = false }) => {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<'wysiwyg' | 'source'>('wysiwyg');

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: markdownToHtml(initialContent),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      setContent(htmlToMarkdown(editor.getHTML()));
    },
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      if (content !== initialContent) {
        onChange(content);
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [content, initialContent, onChange]);

  useEffect(() => {
    if (editor && editor.isEditable !== !readOnly) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  const handleSourceChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setContent(next);
    editor?.commands.setContent(markdownToHtml(next), { emitUpdate: false });
  };

  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      {!readOnly ? (
        <div className="flex items-center justify-between border-b border-border bg-surface">
          <MenuBar editor={editor} />
          <div className="flex gap-1 px-2">
            {(['wysiwyg', 'source'] as const).map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                onClick={() => setMode(nextMode)}
                className={`rounded-md px-2 py-1 text-xs font-semibold ${mode === nextMode ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-surface-2'}`}
              >
                {nextMode === 'wysiwyg' ? 'Edit' : 'Markdown'}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {mode === 'source' ? (
        <textarea
          value={content}
          onChange={handleSourceChange}
          readOnly={readOnly}
          className="min-h-[300px] w-full resize-y bg-background p-4 font-mono text-sm outline-none"
        />
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none min-h-[300px]">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
};
