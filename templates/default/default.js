// eslint-disable-next-line no-unused-vars,no-empty-function
import {
  div,
} from '../../scripts/dom-helpers.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

/** allow for link attributes to be added by authors
 * example usage = Text [class:button,target:_blank,title:Title goes here]
 * @param main
 */
export function decorateLinks(element) {
  element.querySelectorAll('a').forEach((a) => {
    // match text inside [] and split by '|'
    const match = a.textContent.match(/(.*)\[\[([^\]\]]*)]/);
    if (match) {
      // eslint-disable-next-line no-unused-vars
      const [_, linkText, attrs] = match;
      a.textContent = linkText.trim();
      a.setAttribute('title', a.textContent);
      attrs.split(',').forEach((attr) => {
        let [key, ...value] = attr.trim().split(':');
        key = key.trim().toLowerCase();
        value = value.join().trim();
        if (key) a.setAttribute(key, value);
      });
    }
  });
}

export default async function decorate(doc) {
  const $main = doc.querySelector('main');
  const $leftsection = document.querySelector('.leftsection');
  const $clickElement = $leftsection.querySelector('.default-content-wrapper > p');
  const $activeElement = $leftsection.querySelector('.accordion-ml.block');

  $clickElement.addEventListener('click', () => {
    $clickElement.classList.toggle('active');
    $activeElement.classList.toggle('active');
    const height = document.querySelector(':root');
    const originalHeight = height.style.getPropertyValue('--original-height');
    height.style.setProperty('--height', `${originalHeight}`);
    if (!$clickElement.classList.contains('active')) {
      $activeElement.querySelectorAll('details[open]').forEach((detail) => {
        detail.removeAttribute('open');
      });
    }
  });

  const $rightsection = document.querySelector('.rightsection');

  /* Adding logic for contacf us section */
  const $contactus = document.querySelector('.contact-us');
  if ($contactus && !$contactus.classList.contains('rightsection')) {
    $rightsection.prepend($contactus);
  }

  // change all image anchor links to img tag
  $rightsection.querySelectorAll('a[href$=".jpg"], a[href$=".png"], a[href$=".jpeg"], a[href$=".gif"]').forEach((aEl) => {
    if (['jpg', 'jpeg', 'png', 'gif'].some((ext) => aEl.textContent.trim().endsWith(ext))) {
      const picture = createOptimizedPicture(aEl.href, aEl.href.split('/').pop());
      const parent = aEl.parentElement;
      if (parent.tagName === 'P' && parent.children.length === 1) {
        parent.replaceWith(picture);
      } else {
        aEl.replaceWith(picture);
      }
    }
  });

  decorateLinks($rightsection);

  $rightsection.querySelectorAll('.rightsection.special-words p, .rightsection.special-words ul, .rightsection.special-words h2').forEach((section) => {
    const myReg = /\[\[.*\]\]/g;
    const match1 = section.innerHTML.match(myReg);
    if (match1) {
      // remove the first and last character of the string
      const str = match1[0].slice(2, -2);
      section.innerHTML = section.innerHTML.replace(myReg, `<span class="special"> ${str} </span>`);
    }
    for (let i = 2; i < 100; i += 1) {
      const myVarReg = new RegExp(`\\[${i}\\[.*\\]${i}\\]`, 'g');
      const match = section.innerHTML.match(myVarReg);
      if (match) {
        // remove the first and last character of the string
        if (i > 9 && i < 100) {
          const str = match[0].slice(4, -4);
          section.innerHTML = section.innerHTML.replace(myVarReg, `<span class="special"> ${str} </span>`); // eslint-disable-line no-useless-escape
        } else {
          const str = match[0].slice(3, -3);
          section.innerHTML = section.innerHTML.replace(myVarReg, `<span class="special"> ${str} </span>`); // eslint-disable-line no-useless-escape
        }
      }
    }
  });

  const $mainmenu = div({ class: 'mainmenu' }, $leftsection, $rightsection);
  $main.append($mainmenu);
}
