import {
  div,
} from '../../scripts/dom-helpers.js';
import { loadScript } from '../../scripts/aem.js';

export default async function decorate(block) {
  const gseDivHeader = div({ class: 'gcse-searchresults-only' });
  const gseDiv = div({ class: 'gcse-search' });
  gseDivHeader.setAttribute('data-linkTarget', '_blank');
  gseDiv.setAttribute('data-linkTarget', '_blank');
  block.innerHTML = '';
  const searchPath = '/search-header';
  if (window.location.pathname.includes(searchPath)) {
    block.append(gseDivHeader);
  } else {
    block.append(gseDiv);
  }
  await loadScript('/widgets/googlesearch/googlesearch.js');
}
