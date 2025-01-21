import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  [...block.children].forEach((row) => {
    [...row.children].forEach((col, i) => {
      if (i === 0 && col.querySelector('a')) {
        const imgSrc = col.querySelector('a').href;
        const pic = createOptimizedPicture(imgSrc, imgSrc.split('/').pop());
        if (pic) {
          col.replaceWith(pic);
        }
      }
    });
  });
  const cols = [...block.firstElementChild.children];

  block.classList.add(`columns-${cols.length}-cols`);
  for (let i = 0; i < cols.length; i += 1) {
    cols[i].classList.add(`column${i + 1}`);
    [...cols[i].children].forEach((child) => {
      child.classList.remove('button-container');
      child.classList.add('columns-paragraph');
      child.classList.add(`column${i + 1}-paragraph`);
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
