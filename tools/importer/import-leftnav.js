/* global WebImporter */
/* eslint-disable no-console */
import {
  PREVIEW_DOMAIN, createMetadata, getSanitizedPath, fixPdfLinks, getImportPagePath,
  getDesktopBgBlock, getMobileBgBlock, buildSectionMetadata, blockSeparator, setPageTitle,
  fixLinks, getPreviewDomainLink, fixImageLinks, fetchAndParseDocument, fixImageSrcPath,
  rightSectionFixes,
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

function buildCardsClickableBlock(main, results, imagePath) {
  const tileBoxEl = main.querySelector('.tiles-box');
  if (!tileBoxEl) {
    console.log('Cards block not found');
    return;
  }
  const cards = [];
  [...tileBoxEl.children].forEach((a) => {
    const card = {
      href: new URL(getSanitizedPath(a.href), PREVIEW_DOMAIN).toString(),
      imageSrc: fixImageSrcPath(a.querySelector('.tile-icon-box img').src, results, imagePath),
      title: a.querySelector('.tile-link').innerText.trim(),
      brief: a.querySelector('.tile-brief').innerText.trim(),
    };
    cards.push(card);
  });

  const cells = [];
  cards.forEach((card) => {
    const imgLink = document.createElement('a');
    const info = document.createElement('div');
    if (card.imageSrc) {
      imgLink.href = card.imageSrc;
      imgLink.innerText = card.imageSrc;
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
    cells.push([imgLink, info]);
  });

  const cardBlock = WebImporter.Blocks.createBlock(document, {
    name: 'Cards (Clickable)',
    cells: [...cells],
  });

  tileBoxEl.replaceWith(cardBlock);
}

function buildCardsStaffBlock(main, contactsDiv, results, assetsPath) {
  const staffTilesEl = main.querySelectorAll('.staff-tiles-box');
  if (staffTilesEl.length === 0) {
    console.log('Cards staff block not found');
    return;
  }

  const cards = [];
  staffTilesEl.forEach((staffTile) => {
    staffTile.querySelectorAll('.staff-tile').forEach((tile, i) => {
      const card = {
        href: new URL(getSanitizedPath(tile.querySelector('.tile-detail')?.href), PREVIEW_DOMAIN).toString(),
        imageSrc: fixImageSrcPath(tile.querySelector('.staff-tile-img-box img')?.src, results, assetsPath),
        name: tile.querySelector('.tile-detail .staff-tile-name').innerText.trim(),
        title: tile.querySelector('.tile-detail .staff-tile-title').innerText.trim(),
        phoneSrc: contactsDiv.item(i).querySelector('a[href^="tel:"]')?.href,
        emailSrc: contactsDiv.item(i).querySelector('a[href^="mailto:"]')?.href,
        facebookSrc: contactsDiv.item(i).querySelector('a[href*="facebook"]')?.href,
        youtubeSrc: contactsDiv.item(i).querySelector('a[href*="youtube"]')?.href,
        xSrc: contactsDiv.item(i).querySelector('a[href*="twitter"]')?.href,
        instagramSrc: contactsDiv.item(i).querySelector('a[href*="instagram"]')?.href,
      };
      cards.push(card);
    });
  });

  const cells = [];
  cards.forEach((card) => {
    const imgLink = document.createElement('a');
    const name = document.createElement('p');
    const title = document.createElement('p');
    const link = document.createElement('a');
    const contact = document.createElement('div');
    if (card.imageSrc) {
      imgLink.href = card.imageSrc;
      imgLink.innerText = card.imageSrc;
    }
    if (card.name) {
      name.innerText = card.name;
    }
    if (card.title) {
      title.innerText = card.title;
    }
    if (card.href) {
      link.innerText = card.href;
      link.setAttribute('href', card.href);
    }
    if (card.phoneSrc) {
      const el = document.createElement('a');
      el.href = card.phoneSrc;
      el.innerText = 'phone';
      contact.append(el);
      contact.append(document.createElement('br'));
    }
    if (card.emailSrc) {
      const el = document.createElement('a');
      el.href = card.emailSrc;
      el.innerText = 'email';
      contact.append(el);
      contact.append(document.createElement('br'));
    }
    if (card.facebookSrc) {
      const el = document.createElement('a');
      el.href = card.facebookSrc;
      el.innerText = 'facebook';
      contact.append(el);
      contact.append(document.createElement('br'));
    }
    if (card.youtubeSrc) {
      const el = document.createElement('a');
      el.href = card.youtubeSrc;
      el.innerText = 'youtube';
      contact.append(el);
      contact.append(el); contact.append(document.createElement('br'));
    }
    if (card.xSrc) {
      const el = document.createElement('a');
      el.href = card.xSrc;
      el.innerText = 'twitter';
      contact.append(el);
      contact.append(el); contact.append(document.createElement('br'));
    }
    if (card.instagramSrc) {
      const el = document.createElement('a');
      el.href = card.instagramSrc;
      el.innerText = 'instagram';
      contact.append(el);
      contact.append(el); contact.append(document.createElement('br'));
    }
    cells.push([imgLink, name, title, link, contact]);
  });

  const cardBlock = WebImporter.Blocks.createBlock(document, {
    name: 'Cards (staff)',
    cells: [...cells],
  });

  staffTilesEl[0].replaceWith(cardBlock);
  for (let i = 1; i < staffTilesEl.length; i += 1) {
    staffTilesEl[i].remove();
  }
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

function buildCardsTilesBlock(main, results, imagePath = 'general') {
  const tilesEl = main.querySelector('#visitors-tiles');
  if (tilesEl) {
    const cells = [];
    [...tilesEl.children].forEach((tile) => {
      const link = getPreviewDomainLink(tile.href);
      const title = tile.querySelector('.visitors-tile-text').textContent.trim();

      const imgSrc = tile.querySelector('.visitors-tile-banner').style['background-image'];
      const urlMatch = imgSrc ? imgSrc.match(/url\(["']?(.*?)["']?\)/) : '';
      const url = urlMatch ? urlMatch[1] : null;
      const fixedImgLink = fixImageSrcPath(url, results, imagePath);

      const titleAEl = document.createElement('a');
      titleAEl.href = link;
      titleAEl.innerText = title;

      const imageAEl = document.createElement('a');
      imageAEl.href = fixedImgLink;
      imageAEl.innerText = fixedImgLink;

      cells.push([imageAEl, titleAEl]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: 'cards (tiles)',
      cells: [...cells],
    });
    tilesEl.replaceWith(block);
  } else {
    console.log('Visitors tiles cards not found');
  }
}

function printBreadcrumbUrl(main, results, newPath) {
  const parts = [];
  const breadcrumbsUl = main.querySelectorAll('li');
  breadcrumbsUl.forEach((li) => {
    parts.push(li.textContent.trim());
  });
  const category = parts.join(' > ');
  results.push({
    path: newPath,
    report: {
      crumbs: category,
    },
  });
}

export default {

  transform: async ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const main = document.body;
    const results = [];

    const newPagePath = getImportPagePath(params.originalURL);

    const leftNavAsideEl = main.querySelector('aside#freeform-left-box');
    const breadcrumbsEl = main.querySelector('#breadcrumbs');

    if (breadcrumbsEl) {
      printBreadcrumbUrl(breadcrumbsEl, results, newPagePath);
    }

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

    let assetsPath;
    if (newPagePath.startsWith('/') && newPagePath.split('/').length > 2) {
      assetsPath = newPagePath.split('/').slice(1, 3).join('/');
    } else if (newPagePath.startsWith('/') && newPagePath.split('/').length === 2) {
      [, assetsPath] = newPagePath.split('/');
    }

    fixPdfLinks(main, results, newPagePath, assetsPath);
    fixPdfLinks(leftNavAsideEl, results, newPagePath, assetsPath);
    fixLinks(main);
    fixLinks(leftNavAsideEl);
    fixImageLinks(main, results, assetsPath);

    setPageTitle(main, params);

    /* Start for leftnav */
    if (leftNavAsideEl) {
      const leftNavHeading = leftNavAsideEl.querySelector('#flyout-header').textContent.trim();
      const leftSectionBlock = buildLeftNavAccordionBlock(leftNavAsideEl);
      const leftSectionHeading = document.createElement('h2');
      leftSectionHeading.innerText = leftNavHeading;
      const subMenuToggleEl = document.createElement('p');
      subMenuToggleEl.innerText = ':submenu: SUB MENU';
      const leftSectionMetadata = buildSectionMetadata([['Style', 'leftsection']]);

      main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
      main.insertBefore(leftSectionMetadata, main.firstChild);

      const businessHoursLeftNavCard = buildLeftnavHourCardsBlock(leftNavAsideEl);
      if (businessHoursLeftNavCard != null) {
        main.insertBefore(businessHoursLeftNavCard, main.firstChild);
      }

      const contactUsLeftNavCard = buildLeftnavContactCardsBlock(leftNavAsideEl);
      if (contactUsLeftNavCard != null) {
        main.insertBefore(contactUsLeftNavCard, main.firstChild);
      }
      main.insertBefore(leftSectionBlock, main.firstChild);
      main.insertBefore(leftSectionHeading, main.firstChild);
      main.insertBefore(subMenuToggleEl, main.firstChild);
    }
    /* End for leftnav */

    /* Start for hero image */
    const desktopBlock = getDesktopBgBlock();
    const mobileBlock = getMobileBgBlock();
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(mobileBlock, main.firstChild);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(desktopBlock, main.firstChild);
    /* End for hero image */

    // add right section
    const rightSectionMetadata = buildSectionMetadata([['Style', 'rightsection']]);
    buildCardsClickableBlock(main, results, assetsPath);
    buildFaqAccordion(main);
    buildNewsletterAccordion(main, results);
    buildIframeForm(main);
    buildCardsTilesBlock(main, results, assetsPath);

    const doc = await fetchAndParseDocument(url);
    let contactsDiv;
    if (doc) {
      const { body } = doc;
      contactsDiv = body.querySelectorAll('.staff-tile-contacts');
    }
    buildCardsStaffBlock(main, contactsDiv, results, assetsPath);
    rightSectionFixes(main);
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
