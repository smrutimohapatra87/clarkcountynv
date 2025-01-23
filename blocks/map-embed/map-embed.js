import { iframe } from '../../scripts/dom-helpers.js';

let $mapEmbedUrl = '';

export default function decorate(block) {
  [...block.children].forEach((row) => {
    if (row.querySelector('a')) {
      $mapEmbedUrl = row.querySelector('a').href;
      const $iframe = iframe(
        {
          src: $mapEmbedUrl,
          allowFullscreen: true,
          frameBorder: 0,
          class: 'map-embed',
        },
      );
      row.replaceWith($iframe);
    }
  });
}
