import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(doc) {
  const aElems = doc.querySelectorAll('a.button');
  aElems.forEach((aElem) => {
    aElem.classList.remove('button');
  });

  doc.querySelectorAll('a[href$=".jpg"], a[href$=".png"], a[href$=".jpeg"], a[href$=".gif"]').forEach((aEl) => {
    if (['jpg', 'jpeg', 'png', 'gif'].some((ext) => aEl.textContent.trim().endsWith(ext))) {
      const picture = createOptimizedPicture(aEl.href, aEl.href.split('/').pop());
      const parent = aEl.parentElement;
      if (parent.tagName === 'P') {
        parent.replaceWith(picture);
      } else {
        aEl.replaceWith(picture);
      }
    }
  });
}
