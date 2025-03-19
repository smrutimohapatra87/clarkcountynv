import { iframe, p } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const mapEmbedEl = row.querySelector('a');
    if (mapEmbedEl) {
      const mapLink = mapEmbedEl.href;
      const $iframe = iframe(
        {
          src: mapLink,
          allowFullscreen: true,
          frameBorder: 0,
          class: 'map-embed',
        },
      );
      row.replaceWith($iframe);
      if (mapEmbedEl.textContent.trim() !== mapLink) {
        $iframe.parentElement.appendChild((p({ class: 'map-title' }, mapEmbedEl.textContent.trim())));
      }
    }
  });
}
