'use client';

import { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Eye, 
  Code 
} from 'lucide-react';

export default function RichEditor({ value = '', onChange }) {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const textareaRef = useRef(null);

  // Helper to wrap or insert text at cursor
  const insertFormatting = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = `${before}${selected || 'Sample Text'}${after}`;

    const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 11));
    }, 50);
  };

  const handlePromptLink = () => {
    const url = prompt('Enter the full link destination URL (https://...):');
    if (url) {
      insertFormatting(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, '</a>');
    }
  };

  const handlePromptImage = () => {
    const url = prompt('Enter the image URL:');
    if (url) {
      insertFormatting(`<img src="${url}" alt="`, '" />');
    }
  };

  return (
    <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="bg-slate-100 border-b border-slate-300 px-3 py-2 flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center space-x-1 flex-wrap">
          <button
            type="button"
            onClick={() => insertFormatting('<strong>', '</strong>')}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('<em>', '</em>')}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting('\n<h2>', '</h2>\n')}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n<h3>', '</h3>\n')}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting('\n<p>', '</p>\n')}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors text-xs font-bold font-mono"
            title="Paragraph"
          >
            &para;
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n<blockquote>', '</blockquote>\n')}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n<ul>\n  <li>', '</li>\n</ul>\n')}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n<ol>\n  <li>', '</li>\n</ol>\n')}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={handlePromptLink}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePromptImage}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Editor / Preview Tabs */}
        <div className="flex items-center space-x-1 border border-slate-300 rounded bg-white p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center ${
              activeTab === 'editor'
                ? 'bg-[#0b2545] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 mr-1" />
            Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center ${
              activeTab === 'preview'
                ? 'bg-[#0b2545] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Live Preview
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === 'editor' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          placeholder="Write the full formatted news story here. Use HTML tags or toolbar buttons above for headings, paragraphs, quotes, and links..."
          className="w-full p-4 font-mono text-sm leading-relaxed text-slate-800 bg-white focus:outline-none resize-y"
        />
      ) : (
        <div className="p-6 bg-slate-50 min-h-[350px] overflow-y-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b border-slate-200">
            Editorial Preview Mode
          </div>
          <div
            className="article-body font-serif text-slate-800 max-w-none"
            dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400 italic">No content written yet.</p>' }}
          />
        </div>
      )}
    </div>
  );
}
