import { iframe } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  const $mapEmbedUrl = block.querySelector('a').href;
  const $iframe = iframe(
    {
      src: $mapEmbedUrl,
      allowFullscreen: true,
      frameBorder: 0,
      class: 'map-embed',
    },
  );
  block.replaceWith($iframe);
}
