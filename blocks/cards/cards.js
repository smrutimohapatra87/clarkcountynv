import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  ul, li, a,
} from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  /* change to ul, li */
  const $ul = ul();
  [...block.children].forEach((row) => {
    if (block.classList.contains('clickable')) {
      const $li = li();
      const aEle = a();
      aEle.append($li);
      while (row.firstElementChild) $li.append(row.firstElementChild);
      [...$li.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
        else {
          div.className = 'cards-card-body';
          if (div.querySelector('a')) {
            aEle.href = div.querySelector('a').href;
            div.querySelector('a').remove();
          }
        }
      });
      $ul.append(aEle);
    } else {
      const $li = li();
      while (row.firstElementChild) $li.append(row.firstElementChild);
      [...$li.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
        else div.className = 'cards-card-body';
      });
      $ul.append($li);
    }
  });
  $ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append($ul);
}
