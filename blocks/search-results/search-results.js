import {
  div,
} from '../../scripts/dom-helpers.js';
import { loadScript } from '../../scripts/aem.js';

export default async function decorate(block) {
  const gseDiv = div({ class: 'gcse-searchresults-only' });
  gseDiv.setAttribute('data-linkTarget', '_blank');
  block.innerHTML = '';
  block.append(gseDiv);
  await loadScript('/widgets/googlesearch/googlesearch.js');
}
