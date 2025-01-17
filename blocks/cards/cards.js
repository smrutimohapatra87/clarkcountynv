import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  ul, li, a, div, img, h4, i, br,
} from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  /* change to ul, li */
  const $ul = ul();
  [...block.children].forEach((row) => {
    if (block.classList.contains('clickable') || block.classList.contains('clickable-images')) {
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
    } else if (block.classList.contains('staff')) {
      const imgSrc = row.children[0].querySelector('img')?.src;
      const altText = imgSrc?.split('/').pop().split('?')[0];
      const name = row.children[1].textContent;
      const title = row.children[2].textContent;
      const pageLink = row.children[3].querySelector('a')?.href;
      const phone = row.children[4].querySelector('a[title="phone"]')?.href;
      const email = row.children[4].querySelector('a[title="email"]')?.href;
      const facebookSrc = row.children[4].querySelector('a[title="facebook"]')?.href;
      const youtubeSrc = row.children[4].querySelector('a[title="youtube"]')?.href;
      const twitterSrc = row.children[4].querySelector('a[title="twitter"]')?.href;
      const instagramSrc = row.children[4].querySelector('a[title="instagram"]')?.href;

      $ul.append(
        li(
          a(
            { href: pageLink || '', class: 'tile-detail', style: pageLink ? '' : 'pointer-events: none;' },
            div({ class: 'staff-tile-img-box' }, img({ src: imgSrc, alt: altText || '' })),
            h4({ class: 'staff-tile-name' }, `${name.split('-')[0]} - `, br(), name.split('-')[1]),
            div({ class: 'staff-tile-title' }, title),
          ),
          div(
            { class: 'staff-tile-contacts' },
            phone ? a(
              { href: phone, class: 'staff-tile-contact-icon' },
              i({ class: 'fa fa-phone' }),
            ) : null,
            email ? a(
              { href: email, class: 'staff-tile-contact-icon' },
              i({ class: 'fa fa-envelope' }),
            ) : null,
            facebookSrc ? a(
              { href: facebookSrc, class: 'staff-tile-contact-icon' },
              i({ class: 'fa fa-facebook' }),
            ) : null,
            youtubeSrc ? a(
              { href: youtubeSrc, class: 'staff-tile-contact-icon' },
              i({ class: 'fa fa-youtube' }),
            ) : null,
            twitterSrc ? a(
              { href: twitterSrc, class: 'staff-tile-contact-icon' },
              i({ class: 'fa fa-x-twitter' }),
            ) : null,
            instagramSrc ? a(
              { href: instagramSrc, class: 'staff-tile-contact-icon' },
              i({ class: 'fa fa-instagram' }),
            ) : null,
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
  $ul.querySelectorAll('picture > img').forEach((imgEl) => imgEl.closest('picture').replaceWith(createOptimizedPicture(imgEl.src, imgEl.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append($ul);
}
