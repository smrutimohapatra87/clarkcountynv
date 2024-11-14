import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock, decorateBlock, loadBlock, loadCSS,
} from '../../scripts/aem.js';

/*
  This is not a traditional block, so there is no decorate function.
  Instead, links to a /modals/ path are automatically transformed into a modal.
  Other blocks can also use the createModal() and openModal() functions.
*/

export async function createModal(contentNodes) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);
  const dialog = document.createElement('dialog');
  const dialogContent = document.createElement('div');
  dialogContent.classList.add('modal-content');
  dialogContent.append(...contentNodes);
  dialog.append(dialogContent);

  const closeButton = document.createElement('button');
  closeButton.classList.add('close-button');
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.type = 'button';
  closeButton.innerHTML = '<span class="icon icon-close"></span>';
  closeButton.addEventListener('click', () => dialog.close());
  dialog.prepend(closeButton);

  const block = buildBlock('modal', '');
  document.querySelector('main').append(block);
  decorateBlock(block);
  await loadBlock(block);

  // close on click outside the dialog
  dialog.addEventListener('click', (e) => {
    const {
      left, right, top, bottom,
    } = dialog.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    block.remove();
  });

  // Add CSS classes for li items and a tags - move to socialN.js, socialN.css
  dialog.querySelectorAll('li').forEach((li) => {
    // li.classList.add('nav-item');
    console.log(li);
    li.querySelectorAll('span.icon').forEach((icon) => {
      console.log('icon ', icon);
      console.log('icon.className', icon.className);
      console.log('icon.classList', icon.classList);
      console.log('icon.parentElement', icon.parentElement);
    /*
      if (icon.parentElement.contains('facebook')) {
        console.log('facebook here');
      } else if (icon.parentElement.className('twitter')) {
        console.log('twitter here');
      } else if (icon.parentElement.className('reddit')) {
        console.log('reddit here');
      }
        */
    });
  });

  // check to see if we have close button
  const buttons = dialog.querySelectorAll('.button-container');
  buttons.forEach((button) => {
    const a = button.querySelector('a');
    if (a && a.title.includes('Close')) {
      // TODO: see if we need to reset the url to window.location.href
      a.setAttribute('href', '#');
      a.addEventListener('click', () => {
        dialog.close();
      });
    }
  });

  block.innerHTML = '';
  block.append(dialog);

  return {
    block,
    showModal: () => {
      dialog.showModal();
      // reset scroll position
      setTimeout(() => { dialogContent.scrollTop = 0; }, 0);
      document.body.classList.add('modal-open');
    },
  };
}

export async function openModal(fragmentUrl) {
  const path = fragmentUrl.startsWith('http')
    ? new URL(fragmentUrl, window.location).pathname
    : fragmentUrl;
  const fragment = await loadFragment(path);
  const { showModal } = await createModal(fragment.childNodes);
  showModal();
}
