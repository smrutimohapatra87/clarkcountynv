import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  ul, li, a, div,
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
      [...$li.children].forEach((divEl) => {
        if (divEl.children.length === 1 && divEl.querySelector('picture')) divEl.className = 'cards-card-image';
        else {
          divEl.className = 'cards-card-body';
          if (divEl.querySelector('a')) {
            aEle.href = divEl.querySelector('a').href;
            divEl.querySelector('a').remove();
          }
        }
      });
      $ul.append(aEle);
    } else if (block.classList.contains('tiles')) {
      const $a = row.querySelector('a');
      let url;
      if ($a) {
        url = $a.href;
      }
      const picture = row.querySelector('picture img');
      const backgroundImgSrc = picture ? picture.src : '';
      $ul.append(
        li(
          a(
            { href: url, class: 'visitors-tile' },
            div({ class: 'visitors-tile-banner', style: `background:url('${backgroundImgSrc}') center/contain no-repeat #F5F5F5` }),
            div({ class: 'visitors-tile-text' }, $a.textContent.trim()),
          ),
        ),
      );
    } else {
      const $li = li();
      while (row.firstElementChild) $li.append(row.firstElementChild);
      [...$li.children].forEach((divEl) => {
        if (divEl.children.length === 1 && divEl.querySelector('picture')) divEl.className = 'cards-card-image';
        else divEl.className = 'cards-card-body';
      });
      $ul.append($li);
    }
  });
  $ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append($ul);
}
