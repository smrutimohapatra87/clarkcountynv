/* global WebImporter */
/* eslint-disable no-console */
import {
  PREVIEW_DOMAIN, createMetadata, getSanitizedPath, getCardsImagePath, fixPdfLinks, fixAudioLinks,
  getImportPagePath, getDesktopBgBlock, getMobileBgBlock, buildSectionMetadata, blockSeparator,
  setPageTitle, fixLinks, getPathSegments,
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

function buildLeftNavAccordionBlock(asideEl) {
  const nav = buildLeftNavItems(asideEl.querySelector('#flyout'));
  return WebImporter.Blocks.createBlock(document, {
    name: 'Accordion-ml ',
    cells: [
      [nav],
    ],
  });
}

function buildCardsBlock(main) {
  const tileBoxEl = main.querySelector('.tiles-box');
  if (!tileBoxEl) {
    console.log('Cards block not found');
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

function buildFaqAccordion(main) {
  const faqsEl = main.querySelector('.faqs-main');
  if (!faqsEl) {
    console.log('FAQ accordion not found');
    return;
  }

  const elems = faqsEl.querySelectorAll('.faqs-heading, .faqs-toggle-content');
  const cells = [];
  for (let i = 0; i < elems.length;) {
    cells.push([elems[i].innerText.trim(), elems[i + 1].innerHTML]);
    i += 2;
  }

  const accordionBlock = WebImporter.Blocks.createBlock(document, {
    name: 'accordion (faq)',
    cells: [...cells],
  });

  faqsEl.replaceWith(accordionBlock);
}

function buildNewsletterAccordion(main) {
  const newsletterEl = main.querySelector('#categorties-wrap');
  if (!newsletterEl) {
    console.log('Newsletter accordion not found');
    return;
  }

  const elems = newsletterEl.querySelectorAll('.docs-toggle, .file-group');
  const cells = [];
  for (let i = 0; i < elems.length;) {
    const files = document.createElement('div');
    const summary = elems[i].childNodes[0].nodeValue.trim();
    const liEls = elems[i + 1].querySelectorAll('li');
    liEls.forEach((li) => {
      const a = li.querySelector('a');
      const fileName = a.textContent.trim();
      const { href } = a;
      let description;
      if (li.querySelector('.doc-file-desc')) {
        description = li.querySelector('.doc-file-desc').textContent.trim() || '';
      }

      const elem = document.createElement('a');
      elem.href = href;
      elem.innerText = description ? `${fileName} [description=${description}]` : `${fileName}`;
      files.append(elem);
      files.append(document.createElement('br'));
    });

    cells.push([summary, files]);
    i += 2;
  }

  const docCenterBlock = WebImporter.Blocks.createBlock(document, {
    name: 'document-center',
    cells: [...cells],
  });

  const documentCenterEl = main.querySelector('article#document-center');
  documentCenterEl.replaceWith(docCenterBlock);
}

function buildLeftnavContactCardsBlock(aside, infoTypeSelector = '.freeform-contact') {
  if (aside.querySelector(`${infoTypeSelector}.no-content`) != null) {
    return null;
  }

  const infoEl = aside.querySelector(infoTypeSelector);
  const container = document.createElement('div');
  if (!infoEl) {
    return null;
  }
  const infoTitleEl = infoEl.querySelector('h2');
  const heading = document.createElement('h2');
  heading.innerText = infoTitleEl.textContent.trim();
  container.append(heading);
  infoTitleEl.remove();

  infoEl.querySelectorAll('span').forEach((span) => {
    const p = document.createElement('p');
    p.innerHTML = span.innerHTML;
    container.append(p);
  });

  return WebImporter.Blocks.createBlock(document, {
    name: 'leftnav-info ',
    cells: [
      [container],
    ],
  });
}

function buildLeftnavHourCardsBlock(aside, infoTypeSelector = '.department-hours') {
  if (aside.querySelector(infoTypeSelector).parentElement.classList.contains('no-content')) {
    return null;
  }

  const infoEl = aside.querySelector(infoTypeSelector);
  const container = document.createElement('div');
  if (!infoEl) {
    return null;
  }
  const infoTitleEl = infoEl.querySelector('h2');
  const heading = document.createElement('h2');
  heading.innerText = infoTitleEl.textContent.trim();
  container.append(heading);
  infoTitleEl.remove();

  const { childNodes } = infoEl;
  Array.from(childNodes)
    .filter((node) => node.textContent.trim() === '')
    .forEach((node) => node.remove());

  for (let i = 0; i < childNodes.length;) {
    if (childNodes[i].nodeName.toLowerCase() === 'strong') {
      const strongPrefix = document.createElement('strong');
      strongPrefix.innerText = childNodes[i].textContent.trim();
      const p = document.createElement('p');
      p.append(strongPrefix);
      if (childNodes[i + 1].nodeName.toLowerCase() === '#text') {
        p.append(` ${childNodes[i + 1].textContent.trim()}`);
      }
      container.append(p);
      i += 2;
    } else {
      console.log(`An unhandled tag encountered inside leftNav - ${childNodes[i].nodeName}`);
      i += 1;
    }
  }
  return WebImporter.Blocks.createBlock(document, {
    name: 'leftnav-info ',
    cells: [
      [container],
    ],
  });
}

function buildIframeForm(main) {
  const iframeEl = main.querySelector('#post iframe');
  if (iframeEl) {
    const iframeLink = iframeEl.src;
    const link = document.createElement('a');
    link.href = iframeLink;
    const block = WebImporter.Blocks.createBlock(document, {
      name: 'embed',
      cells: [[iframeLink]],
    });
    iframeEl.replaceWith(block);
  }
  console.log('Iframe form not found');
}

export default {

  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const main = document.body;
    const results = [];

    const leftNavAsideEl = main.querySelector('aside#freeform-left-box');
    const leftNavHeading = leftNavAsideEl.querySelector('#flyout-header').textContent.trim();

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      'aside',
      'section#slider', // hero background image
      'section#modal-section', // Share modal
      'section#newsletter', // footer newsletter
      'noscript',
      '#main',
      '#skip', // skip to main content
      '.modal', // share button modal
      '#goog-gt-tt', // google translation
      '.uwy.userway_p5.utb',
    ]);

    const newPagePath = getImportPagePath(params.originalURL);
    const pathParts = getPathSegments(newPagePath);
    let filesLocation;
    switch (pathParts[0]) {
      case 'government':
        filesLocation = 'government';
        break;
      case 'business':
        filesLocation = 'business';
        break;
      default:
        filesLocation = 'general';
    }

    fixLinks(main);
    fixPdfLinks(main, results, filesLocation);
    fixAudioLinks(main);

    setPageTitle(main, params);

    const desktopBlock = getDesktopBgBlock();
    const mobileBlock = getMobileBgBlock();

    const leftSectionBlock = buildLeftNavAccordionBlock(leftNavAsideEl);
    const leftSectionHeading = document.createElement('h2');
    leftSectionHeading.innerText = leftNavHeading;
    const subMenuToggleEl = document.createElement('p');
    subMenuToggleEl.innerText = ':submenu: SUB MENU';

    const contactUsLeftNavCard = buildLeftnavContactCardsBlock(leftNavAsideEl);
    const businessHoursLeftNavCard = buildLeftnavHourCardsBlock(leftNavAsideEl);

    const leftSectionMetadata = buildSectionMetadata([['Style', 'leftsection']]);
    const rightSectionMetadata = buildSectionMetadata([['Style', 'rightsection']]);

    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(leftSectionMetadata, main.firstChild);
    if (businessHoursLeftNavCard != null) {
      main.insertBefore(businessHoursLeftNavCard, main.firstChild);
    }
    if (contactUsLeftNavCard != null) {
      main.insertBefore(contactUsLeftNavCard, main.firstChild);
    }
    main.insertBefore(leftSectionBlock, main.firstChild);
    main.insertBefore(leftSectionHeading, main.firstChild);
    main.insertBefore(subMenuToggleEl, main.firstChild);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(mobileBlock, main.firstChild);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(desktopBlock, main.firstChild);

    // add right section
    buildCardsBlock(main);
    buildFaqAccordion(main);
    buildNewsletterAccordion(main, results);
    buildIframeForm(main);
    fixLinks(main);
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
