/* global WebImporter */
import {
  createMetadata,
  fixPdfLinks,
  blockSeparator,
  getMobileBgBlock,
  getDesktopBgBlock,
  buildSectionMetadata, getImportPagePath, setPageTitle, extractBackgroundImageUrl, fixImageSrcPath,
} from './utils.js';

export default {

  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const main = document.body;
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
    fixPdfLinks(main, results, newPagePath, 'general/biddetail');

    setPageTitle(main, params);

    /* Start for hero image */
    let imagePath = '';
    if (backgroundImageUrl.search('slide-1') === -1) {
      imagePath = fixImageSrcPath(backgroundImageUrl, results);
    }
    const desktopBlock = getDesktopBgBlock(imagePath);
    const mobileBlock = getMobileBgBlock(imagePath);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(mobileBlock, main.firstChild);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(desktopBlock, main.firstChild);

    /* End for hero image */
    main.append(buildSectionMetadata([['Style', 'biddetail']]));
    main.append(blockSeparator().cloneNode(true));

    params.template = 'agenda';
    params['breadcrumbs-base'] = '/bid-detail/bid-detail-breadcrumbs';
    createMetadata(main, document, params);

    results.push({
      element: main,
      path: newPagePath,
    });

    return results;
  },
};
