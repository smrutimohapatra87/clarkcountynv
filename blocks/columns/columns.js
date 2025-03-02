import { createOptimizedPicture } from '../../scripts/aem.js';
import { a, i } from '../../scripts/dom-helpers.js';

function enablePlaybutton(col, pic, redirectURL) {
  const playButton = a({ class: 'explore-video-play' }, i({ class: 'play-button' }));
  playButton.href = redirectURL;
  col.append(pic);
  col.append(playButton);
  col.classList.add('explore-img');
}

/** allow for link attributes to be added by authors
 * example usage = Text [class:button,target:_blank,title:Title goes here]
 * @param main
 */
export function decorateLinks(element) {
  element.querySelectorAll('a').forEach(($a) => {
    // match text inside [] and split by '|'
    const match = $a.textContent.match(/(.*)\[\[([^\]\]]*)]/);
    if (match) {
      // eslint-disable-next-line no-unused-vars
      const [_, linkText, attrs] = match;
      $a.textContent = linkText.trim();
      $a.setAttribute('title', $a.textContent);
      attrs.split(',').forEach((attr) => {
        let [key, ...value] = attr.trim().split(':');
        key = key.trim().toLowerCase();
        value = value.join().trim();
        if (key) $a.setAttribute(key, value);
      });
    }
  });
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      if (col.querySelectorAll('a') && col.querySelectorAll('p:not(:has(a)), h1, h2, h3, h4, h5, h6, div').length === 0) {
        const imgSrc = col.querySelectorAll('a')[0].href;
        const pic = createOptimizedPicture(imgSrc, imgSrc.split('/').pop());
        if (col.querySelectorAll('a')[1]) {
          const redirectElement = col.querySelectorAll('a')[1];
          if (pic) {
            col.innerHTML = '';
            if (redirectElement.href.includes('youtube.com') || redirectElement.href.includes('youtu.be')) {
              enablePlaybutton(col, pic, redirectElement.href);
            } else {
              const redirect = a({ class: 'redirect' });
              redirect.href = redirectElement.href;
              redirect.append(pic);
              col.append(pic);
              col.classList.add('explore-img');
            }
          }
        } else if (pic) {
          col.innerHTML = '';
          col.append(pic);
          col.classList.add('explore-img');
        }
      } else {
        col.classList.add('explore-item');
        decorateLinks(col);
      }
    });
  });
  const cols = [...block.firstElementChild.children];

  block.classList.add(`columns-${cols.length}-cols`);
  for (let counter = 0; counter < cols.length; counter += 1) {
    cols[counter].classList.add(`column${counter + 1}`);
    [...cols[counter].children].forEach((child) => {
      child.classList.remove('button-container');
      child.classList.add('columns-paragraph');
      child.classList.add(`column${counter + 1}-paragraph`);
    });
  }

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
