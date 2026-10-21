import { sanitize } from 'isomorphic-dompurify';
import type { BuiltChild, BuiltButton } from './component-embed';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function renderButton(button: BuiltButton): string {
  const label = button.label ?? button.url;
  const emoji = button.emoji?.name
    ? `<span class="emoji">${button.emoji.name}</span> `
    : '';

  return `
    <a href="${escapeHtml(button.url)}" target="_blank" rel="noopener noreferrer" class="discord-button" style="--button-style: ${button.style}; ${button.disabled ? 'opacity: 0.5; pointer-events: none;' : ''}">
      ${emoji}${escapeHtml(label)}
    </a>
  `;
}

function renderActionRow(actionRow: BuiltChild & { type: 1 }): string {
  const buttons = actionRow.components.map(renderButton).join('');
  return `<div class="action-row">${buttons}</div>`;
}

function renderTextDisplay(text: BuiltChild & { type: 10 }): string {
  return `<div class="text-display">${sanitize(text.content, { USE_PROFILES: { html: true }, FORBID_TAGS: ['script', 'style', 'iframe'] })}</div>`;
}

function renderSection(section: BuiltChild & { type: 9 }): string {
  const texts = section.components.map(renderTextDisplay).join('');
  const accessoryHtml =
    section.accessory.type === 2
      ? renderButton(section.accessory)
      : `<div class="thumbnail" style="background-image: url('${escapeHtml(section.accessory.media.url)}')${section.accessory.spoiler ? '; filter: blur(10px);' : ''}"${section.accessory.description ? ` title="${escapeHtml(section.accessory.description)}"` : ''}></div>`;

  return `
    <div class="section">
      <div class="section-texts">${texts}</div>
      <div class="section-accessory">${accessoryHtml}</div>
    </div>
  `;
}

function renderMediaGallery(gallery: BuiltChild & { type: 12 }): string {
  const items = gallery.items
    .map((item) => `
      <div class="gallery-item"${item.spoiler ? ' style="filter: blur(10px);"' : ''}>
        <img src="${escapeHtml(item.media.url)}" alt="" loading="lazy" />
        ${item.description ? `<div class="gallery-caption">${escapeHtml(item.description)}</div>` : ''}
      </div>
    `)
    .join('');

  return `<div class="media-gallery">${items}</div>`;
}

function renderSeparator(separator: BuiltChild & { type: 14 }): string {
  return `<hr class="separator"${separator.divider === false ? ' style="border: none;"' : ''} />`;
}

export function renderComponentsToHtml(components: BuiltChild[]): string {
  const parts = components.map((child) => {
    switch (child.type) {
      case 1:
        return renderActionRow(child);
      case 10:
        return renderTextDisplay(child);
      case 9:
        return renderSection(child);
      case 12:
        return renderMediaGallery(child);
      case 14:
        return renderSeparator(child);
      default:
        return '';
    }
  });

  return `<div class="component-embed">${parts.join('')}</div>`;
}

export const componentEmbedStyles = `
<style>
.component-embed {
  font-family: "gg sans", "Noto Sans", system-ui, sans-serif;
  color: #dcddde;
  max-width: 720px;
}
.action-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.discord-button {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.15s ease;
  background: #7289da;
  color: #fff;
}
.discord-button:hover { opacity: 0.8; }
.text-display { margin: 4px 0; }
.text-display h1 { font-size: 24px; font-weight: 700; margin: 16px 0 8px; }
.text-display h2 { font-size: 20px; font-weight: 600; margin: 14px 0 7px; }
.text-display h3 { font-size: 16px; font-weight: 600; margin: 12px 0 6px; }
.text-display p { margin: 8px 0; }
.text-display a { color: #5865f2; text-decoration: none; }
.text-display a:hover { text-decoration: underline; }
.text-display code { background: #2b2d31; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
.text-display pre { background: #1e1f22; padding: 12px; border-radius: 4px; overflow: auto; }
.text-display pre code { background: none; padding: 0; }
.text-display blockquote { border-left: 3px solid #4f545c; padding-left: 12px; margin: 8px 0; color: #8e9297; }
.text-display ul, .text-display ol { padding-left: 24px; margin: 8px 0; }
.text-display li { margin: 4px 0; }
.section { display: flex; gap: 16px; margin: 12px 0; }
.section-texts { flex: 1; min-width: 0; }
.section-accessory { flex-shrink: 0; width: 80px; height: 80px; border-radius: 8px; background-size: cover; background-position: center; }
.media-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin: 12px 0; }
.gallery-item { position: relative; border-radius: 8px; overflow: hidden; aspect-ratio: 1; }
.gallery-item img { width: 100%; height: 100%; object-fit: cover; }
.gallery-caption { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: #fff; padding: 8px 6px 4px; font-size: 12px; }
.separator { border: none; border-top: 1px solid #4f545c; margin: 16px 0; }
</style>
`;