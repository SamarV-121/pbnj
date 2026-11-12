import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

// Raw HTML is escaped, and markdown-it rejects javascript: and non-image data: URLs
const md = new MarkdownIt({
  html: false,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      const { value } = hljs.highlight(code, { language: lang });
      return `<pre class="hljs"><code>${value}</code></pre>`;
    }
    return '';
  },
});

// Paste images are gated by the paste's key, so their URLs need it appended
md.core.ruler.push('pbnj_image_key', state => {
  const key = state.env?.imageKey;
  if (!key) return;

  for (const block of state.tokens) {
    for (const token of block.children ?? []) {
      if (token.type !== 'image') continue;
      const src = token.attrGet('src');
      if (src?.startsWith('/i/')) {
        token.attrSet('src', `${src}${src.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`);
      }
    }
  }
});

export function renderMarkdown(source: string, key: string | null): string {
  return md.render(source, { imageKey: key });
}
