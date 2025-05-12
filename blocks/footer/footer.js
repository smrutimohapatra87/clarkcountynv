import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { div } from '../../scripts/dom-helpers.js';
import { replaceClickableImageLinkWithImage } from '../../scripts/utils.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = div();
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  const newsletterLink = footer.querySelector('.newsletter a');
  newsletterLink.classList?.remove('button');

  replaceClickableImageLinkWithImage(footer.querySelector('.footer-left'));

  footer.querySelectorAll('.footer-right a').forEach((aEl, index) => {
    // set unique aria label for each link
    const ariaLabel = `social-link-${index + 1}`;
    aEl.setAttribute('aria-label', ariaLabel);
  });

  // add class to footer-contact
  const paragraphs = footer.querySelectorAll('.footer-middle p');
  paragraphs.forEach((p) => {
    if (p.textContent.startsWith('Phone')) {
      p.classList.add('contact-data');
    } else if (p.textContent.startsWith('Address')) {
      p.classList.add('address-data');
    }
  });

  block.append(footer);
}
