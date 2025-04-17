/* global WebImporter */
import {
  createMetadata,
  fixPdfLinks,
  blockSeparator,
  getMobileBgBlock,
  getDesktopBgBlock,
  buildSectionMetadata,
  getImportPagePath,
  setPageTitle,
  extractBackgroundImageUrl,
  fixImageSrcPath,
  getSanitizedPath,
  PREVIEW_DOMAIN,
} from './utils.js';

export default {

  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const main = document.body;
    const finalBody = document.createElement('body');
    const results = [];
    const heroBackgroundEl = main.querySelector('div.tns-bg-slide');
    const backgroundImageUrl = extractBackgroundImageUrl(heroBackgroundEl);

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      'section', // hero background image
      'noscript',
      '#main',
      '#skip', // skip to main content
      '.modal', // share button modal
      '#goog-gt-tt', // google translation
      '.uwy.userway_p5.utb',
    ]);

    const newPagePath = getImportPagePath(params.originalURL);

    // Handle all PDFs
    fixPdfLinks(main, results, newPagePath, 'general/business-detail');

    setPageTitle(main, params);

    /* Start for hero image */
    let imagePath = '';
    if (backgroundImageUrl.search('slide-1') === -1) {
      imagePath = fixImageSrcPath(backgroundImageUrl, results);
    }
    const desktopBlock = getDesktopBgBlock(imagePath);
    const mobileBlock = getMobileBgBlock(imagePath);
    finalBody.append(blockSeparator().cloneNode(true));
    finalBody.insertBefore(mobileBlock, finalBody.firstChild);
    finalBody.insertBefore(blockSeparator().cloneNode(true), finalBody.firstChild);
    finalBody.insertBefore(desktopBlock, finalBody.firstChild);

    const cells = [];
    const col1 = main.querySelector('.bus-detail');
    const iconCell = document.createElement('div');
    const phone = col1.querySelector('.fa-phone');
    if (phone) {
      const phoneLink = phone.closest('a');
      if (phoneLink) {
        const text = phoneLink.textContent.trim();
        phoneLink.textContent = `:phone: ${text}`;
        // phoneLink.replaceChildren();
        iconCell.append(phoneLink.cloneNode(true));
        iconCell.append(document.createElement('br'));
      }
    }

    const email = col1.querySelector('.fa-envelope');
    if (email) {
      const emailLink = email.closest('a');
      if (emailLink) {
        const text = emailLink.textContent.trim();
        emailLink.textContent = `:email: ${text}`;
        // emailLink.replaceChildren();
        iconCell.append(emailLink.cloneNode(true));
        iconCell.append(document.createElement('br'));
      }
    }

    const map = col1.querySelector('.fa-map-marker');
    if (map) {
      const el = document.createElement('p');
      el.textContent = `:location: ${map.nextSibling.textContent.trim()}`;
      iconCell.append(el);
      iconCell.append(document.createElement('br'));
    }

    const site = col1.querySelector('.fa-globe');
    if (site) {
      const siteEl = site.nextElementSibling;

      if (siteEl.tagName === 'A') {
        const siteLink = siteEl.getAttribute('href');
        const sanitizedPath = new URL(getSanitizedPath(siteLink), PREVIEW_DOMAIN);
        const finalReadMoreUrl = new URL(sanitizedPath.pathname, PREVIEW_DOMAIN).toString();

        const aEl = document.createElement('a');
        aEl.href = finalReadMoreUrl;
        aEl.textContent = `:globe: ${finalReadMoreUrl.replace(PREVIEW_DOMAIN, 'https://www.clarkcountynv.gov')}`;
        iconCell.append(aEl);
      }
    }

    const contentCell = document.createElement('div');
    const col2 = main.querySelector('.header');
    if (col2) {
      const par = col2.parentElement;
      contentCell.append(par.cloneNode(true));
    }

    cells.push([iconCell, contentCell]);
    const tableBlock = WebImporter.Blocks.createBlock(document, {
      name: 'table (no-header, business-detail)',
      cells: [...cells],
    });
    finalBody.append(tableBlock);

    let iframeSrc = main.querySelector('.leftnav-map iframe')?.src;
    if (iframeSrc) {
      iframeSrc = iframeSrc.replace('AIzaSyAOLPINIt8gtJpi00yqu4vHL9Ye6hhKDYI', 'AIzaSyC5cMe92Yw3JgHrkvgIyHgdS2lTsH4C95k');
      const mapEl = document.createElement('a');
      mapEl.href = iframeSrc;
      mapEl.textContent = iframeSrc;

      const mapBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Map-embed (business-map-bottom)',
        cells: [[mapEl]],
      });
      finalBody.append(mapBlock);
    }

    finalBody.append(buildSectionMetadata([['Style', 'agendadetail, no button']]));
    finalBody.append(blockSeparator().cloneNode(true));

    params.template = 'full';
    createMetadata(finalBody, document, params);

    results.push({
      element: finalBody,
      path: newPagePath,
    });

    return results;
  },
};
