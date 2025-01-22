/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

import { Accordion } from '../accordion-ml/accordion-ml.js';
import {
  button, details, div, h2, input, label, small, span, summary, ul,
} from '../../scripts/dom-helpers.js';

let oldSearch = '';

function slideDown(element, duration = 400) {
  element.style.display = 'block';
  element.style.height = '0';
  element.style.overflow = 'hidden';
  element.style.transition = `height ${duration}ms ease-in-out`;
  element.style.height = `${element.scrollHeight}px`;

  setTimeout(() => {
    element.style.height = '';
    element.style.overflow = '';
    element.style.transition = '';
  }, duration);
}

function slideUp(element, duration = 400) {
  element.style.height = `${element.scrollHeight}px`;
  element.style.overflow = 'hidden';
  element.style.transition = `height ${duration}ms ease-in-out`;

  setTimeout(() => {
    element.style.height = '0';
  }, 10);

  setTimeout(() => {
    element.style.display = 'none';
    element.style.height = '';
    element.style.overflow = '';
    element.style.transition = '';
  }, duration);
}

function searchDocuments(searchValue) {
  oldSearch = searchValue;
  let fileText = '';
  const results = [];

  const files = document.querySelectorAll('.documents-wrap .content .file-item');
  files.forEach((file) => {
    const aEl = file.querySelector('a');
    if (aEl) {
      fileText = aEl.textContent.toUpperCase();
      if (fileText.indexOf(searchValue) >= 0) {
        results.push(file.closest('li'));
        return;
      }
    }
    const spanEl = file.querySelector('span');
    if (spanEl) {
      fileText = spanEl.textContent.toUpperCase();
      if (fileText.indexOf(searchValue) >= 0) {
        results.push(file.closest('li'));
      }
    }
  });

  document.querySelector('.reset-button').style.display = 'block';
  const searchResults = document.querySelector('.search-results');
  searchResults.innerHTML = '';

  if (results.length === 0) {
    searchResults.append(span({ class: 'search-not-found' }, `No results found for: ${searchValue}`));
  } else {
    const ulEl = ul({ class: 'search-result-files' });
    results.forEach((result) => {
      ulEl.append(result.cloneNode(true));
    });
    searchResults.append(ulEl);
  }

  slideDown(searchResults);
  slideUp(document.querySelector('.documents-wrap'));
}

function searchFile() {
  const searchValue = document.querySelector('.search-input').value.trim().toUpperCase();

  if (searchValue.length > 0 && searchValue !== oldSearch) {
    searchDocuments(searchValue.toUpperCase());
  }
}

function clearSearch(element) {
  document.querySelector('.search-input').value = '';
  slideUp(document.querySelector('.search-results'));
  slideDown(document.querySelector('.documents-wrap'));
  element.style.display = 'none';
  oldSearch = '';
}

function createFileSearchForm(block) {
  const searchLabel = label({ class: 'search-label', for: 'file-search' }, h2('Search for file name:'));
  const searchInput = input({
    class: 'search-input', type: 'text', placeholder: 'search here', onkeypress: (e) => { if (e.key === 'Enter') searchFile(); },
  });
  const searchButton = button({ class: 'search-button', onclick: () => searchFile() }, 'Search');
  const resetButton = button({ class: 'reset-button', onclick(e) { clearSearch(this, e); } }, 'RESET');
  const searchForm = div(
    { class: 'search-form' },
    searchLabel,
    searchInput,
    searchButton,
    resetButton,
  );
  block.insertBefore(searchForm, block.firstChild);
}

export default function decorate(block) {
  const searchResults = div({ class: 'search-results' });
  const container = div({ class: 'documents-wrap' });
  [...block.children].forEach((row) => {
    // decorate accordion item label

    const fileGroup = row.children[0];
    const summaryEl = summary({ class: 'accordion-item-label' }, ...fileGroup.childNodes, small({ class: 'doc-center-counter' }, '2 documents'));

    const body = row.children[1];
    body.className = 'content';
    const fileLinks = body.querySelectorAll('a');
    const numOfDocs = fileLinks.length;
    summaryEl.querySelector('.doc-center-counter').textContent = `${numOfDocs} documents`;
    fileLinks.forEach((fileLink) => {
      const fullFileTitle = fileLink.textContent.trim();
      const fileTypeClass = fileLink.href.split('.').pop().endsWith('pdf') ? 'fa-file-pdf-o' : 'fa-file-text-o';
      fileLink.classList.add(fileTypeClass);
      let fileDescription;
      if (fullFileTitle.search('\\[description=') !== -1) {
        fileDescription = fullFileTitle.split('[description=')[1].slice(0, -1);
        const [fileName] = fullFileTitle.split('[description=');
        fileLink.textContent = fileName;
      }
      fileLink.replaceWith(div({ class: 'file-item' }, fileLink.cloneNode(true), span({ class: 'doc-file-desc' }, fileDescription)));
    });

    // decorate accordion item
    const detailsEl = details({ class: 'accordion-item' }, summaryEl, body);
    container.append(detailsEl);
    row.remove();

    /* const aElems = block.querySelectorAll('.content a');
    aElems.forEach((aElem) => {
      aElem.classList.remove('button');
      aElem.setAttribute('target', '_blank');
    }); */
  });
  block.append(searchResults);
  block.append(container);
  createFileSearchForm(block);

  /* eslint-disable no-new */
  block.querySelectorAll('details').forEach((el) => {
    new Accordion(el);
  });
}
