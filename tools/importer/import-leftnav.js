/* global WebImporter */
import {
  PREVIEW_DOMAIN, createMetadata, getSanitizedPath, getCardsImagePath, fixPdfLinks, fixAudioLinks,
  getImportPagePath, getDesktopBgBlock, getMobileBgBlock, buildSectionMetadata, blockSeparator,
  setPageTitle,
} from './utils.js';

function buildLeftNavItems(root) {
  const parentUl = document.createElement('ul');
  [...root.children].forEach((li) => {
    const a = li.querySelector('a');
    const item = {
      title: a.innerText,
      href: new URL(getSanitizedPath(a.href), PREVIEW_DOMAIN).toString(),
    };
    const listEl = document.createElement('li');
    const aEl = document.createElement('a');
    aEl.innerText = item.title;
    aEl.setAttribute('href', item.href);
    listEl.append(aEl);
    parentUl.append(listEl);
    if (li.classList.contains('children')) {
      // const ulEl = document.createElement('ul');
      listEl.append(buildLeftNavItems(li.querySelector('ul')));
    }
  });
  return parentUl;
}

function buildCardsBlock(main) {
  const tileBoxEl = main.querySelector('.tiles-box');
  if (!tileBoxEl) {
    return;
  }
  const cards = [];
  [...tileBoxEl.children].forEach((a) => {
    const card = {
      href: new URL(getSanitizedPath(a.href), PREVIEW_DOMAIN).toString(),
      imageSrc: getCardsImagePath(a.querySelector('.tile-icon-box img').src),
      imageAlt: a.querySelector('.tile-icon-box img').alt,
      title: a.querySelector('.tile-link').innerText.trim(),
      brief: a.querySelector('.tile-brief').innerText.trim(),
    };
    cards.push(card);
  });

  const cells = [];
  cards.forEach((card) => {
    const img = document.createElement('img');
    const info = document.createElement('div');
    if (card.imageSrc) {
      img.src = card.imageSrc;
      img.setAttribute('alt', card.imageAlt);
    }
    if (card.title) {
      const el = document.createElement('strong');
      el.innerText = card.title;
      info.append(el);
    }
    if (card.brief) {
      const el = document.createElement('p');
      el.innerText = card.brief;
      info.append(el);
    }
    if (card.href) {
      const el = document.createElement('a');
      el.href = card.href;
      el.innerText = card.href;
      info.append(el);
    }
    cells.push([img, info]);
  });

  const cardBlock = WebImporter.Blocks.createBlock(document, {
    name: 'Cards (Clickable)',
    cells: [...cells],
  });

  tileBoxEl.replaceWith(cardBlock);
}

export default {

  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const main = document.body;
    const results = [];

    const leftNavUlEl = main.querySelector('#flyout');
    const leftNavHeading = main.querySelector('#flyout-header').textContent.trim();

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      'aside',
      'section', // hero background image
      'noscript',
      '#main',
      '#skip', // skip to main content
      '.modal', // share button modal
      '#goog-gt-tt', // google translation
      '.uwy.userway_p5.utb',
    ]);

    const newPagePath = getImportPagePath(params.originalURL);

    fixPdfLinks(main, results);
    fixAudioLinks(main);

    setPageTitle(main, params);

    const desktopBlock = getDesktopBgBlock();
    const mobileBlock = getMobileBgBlock();

    const nav = buildLeftNavItems(leftNavUlEl);
    const leftSectionBlock = WebImporter.Blocks.createBlock(document, {
      name: 'Accordion-ml ',
      cells: [
        [nav],
      ],
    });
    const leftSectionHeading = document.createElement('h2');
    leftSectionHeading.innerText = leftNavHeading;
    const subMenuToggleEl = document.createElement('p');
    subMenuToggleEl.innerText = ':submenu: SUB MENU';

    const leftSectionMetadata = buildSectionMetadata([['Style', 'leftsection']]);
    const rightSectionMetadata = buildSectionMetadata([['Style', 'rightsection'], ['temp', 'new']]);

    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(leftSectionMetadata, main.firstChild);
    main.insertBefore(leftSectionBlock, main.firstChild);
    main.insertBefore(leftSectionHeading, main.firstChild);
    main.insertBefore(subMenuToggleEl, main.firstChild);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(mobileBlock, main.firstChild);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(desktopBlock, main.firstChild);

    // add right section
    buildCardsBlock(main);
    main.append(rightSectionMetadata);
    main.append(blockSeparator().cloneNode(true));

    params.template = 'default';
    createMetadata(main, document, params);

    results.push({
      element: main,
      path: newPagePath,
    });
    return results;
  },
};
