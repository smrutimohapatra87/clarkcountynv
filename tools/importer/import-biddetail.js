/* global WebImporter */
import {
  createMetadata,
  fixPdfLinks,
  blockSeparator,
  getMobileBgBlock,
  getDesktopBgBlock,
  buildSectionMetadata, getImportPagePath, setPageTitle,
} from './utils.js';

export default {

  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const main = document.body;
    const results = [];

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
    fixPdfLinks(main, results, newPagePath);

    setPageTitle(main, params);

    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(getMobileBgBlock(), main.firstChild);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(getDesktopBgBlock(), main.firstChild);

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
