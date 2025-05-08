/* global WebImporter */
/* eslint-disable no-console */
import {
  createMetadata,
  blockSeparator,
  getMobileBgBlock,
  getDesktopBgBlock,
  buildSectionMetadata,
  fixPdfLinks,
  fixImageSrcPath,
  fixLinks,
  normalizeFolderName,
} from './utils.js';

export const setPageTitleAnnouncement = (main, params) => {
  const pageTitleEl = main.querySelector('a').innerText.split(':')[1].trim();
  if (pageTitleEl.length > 0) {
    params['page-title'] = pageTitleEl;
  }
};

let publishDate = null;
let parentDiv = null;

const getInfo = async (main, department, results, year) => {
  const rawPublishDate = main.querySelector('a').innerText.split(':')[0].split(',');
  publishDate = `${rawPublishDate[1].trim()}, ${rawPublishDate[2].trim()}`;
  const title = main.querySelector('a').innerText.split(':')[1].trim();
  const category = department;
  const normalizeCategory = normalizeFolderName(department);
  const bannerEl = main.querySelector('img');
  let bannerUrl;
  if (bannerEl) {
    bannerUrl = fixImageSrcPath(bannerEl.getAttribute('src'), results, `general/news/${normalizeCategory}/${year}`);
    console.log(bannerUrl);
  } else {
    bannerUrl = 'https://main--clarkcountynv--aemsites.aem.page/assets/images/general/clarkcounty-logo.png';
  }
  main.querySelector('a').remove();
  return {
    bannerUrl,
    title,
    category,
    publishDate,
    year,
  };
};

function getElement(url, doc) {
  doc.querySelectorAll('.faq-category').forEach((ele) => {
    console.log(ele.querySelector('h2').innerText);
    if (ele.querySelector('h2').innerText.includes('2024')) {
      parentDiv = ele;
    }
  });
  console.log('parentDiv', parentDiv);
  // get the # fragment from url
  const hash = url.split('#')[1];
  // filter the element if hash matches index
  return parentDiv.querySelectorAll('.faq-item')[hash];
}

export const buildTextMetadata = (cells) => WebImporter.Blocks.createBlock(document, {
  name: 'text (center)',
  cells: [...cells],
});

export const getTextBlock = (title) => buildTextMetadata([
  [title],
]);

export const buildSpacerMetadata = (cells) => WebImporter.Blocks.createBlock(document, {
  name: 'spacer',
  cells: [...cells],
});

export const getSpacerBlock = (value) => buildSpacerMetadata([
  ['Mobile', value],
  ['Tablet', value],
  ['Desktop', value],
]);

function getUrlName(sentence, date) {
  const words = sentence.split(' ');
  const initials = words.map((word) => word.charAt(0));
  const right = initials.join('').toLowerCase();
  const left = date.replace(/\s\s+/g, '').replace(/ /g, '').replace(/\./, '').split(',')
    .join('-')
    .toLowerCase();
  return `${left}-${right}`;
}

export default {

  transform: async ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // const main = document.body;
    const main = getElement(params.originalURL, document);
    console.log(main);
    const year = main.querySelector('a').innerText.split(':')[0].split(',')[2].trim();
    const results = [];
    const department = 'Environment and Sustainability';
    const normalizeCategory = normalizeFolderName(department);

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

    // Handle all PDFs
    fixPdfLinks(main, results, '', `general/news/${normalizeCategory}/${year}`);
    setPageTitleAnnouncement(main, params);
    fixLinks(main);

    // Creating a Text block for the title
    let counter = 0;
    const title = main.querySelector('a').innerText.split(':')[1].trim();
    const textBlock = getTextBlock(title);
    main.querySelectorAll('p strong').forEach((ele) => {
      if (ele.innerText === title) {
        ele.remove();
        main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
        main.insertBefore(getSpacerBlock('50px'), main.firstChild);
        main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
        main.insertBefore(textBlock, main.firstChild);
        counter += 1;
        return;
      }
      console.log('counter', counter);
    });

    if (counter === 0) {
      main.insertBefore(textBlock, main.firstChild);
    }

    const listMetadata = await getInfo(main, department, results, year);

    /* Start for hero image */
    const imagePath = '';
    const desktopBlock = getDesktopBgBlock(imagePath);
    const mobileBlock = getMobileBgBlock(imagePath);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(mobileBlock, main.firstChild);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(desktopBlock, main.firstChild);
    /* End for hero image */

    /* Taking care of rest of the images */
    main.querySelectorAll('img').forEach((image) => {
      const imageUrl = fixImageSrcPath(image.getAttribute('src'), results, `general/news/${normalizeCategory}/${year}`);
      const imageAEl = document.createElement('a');
      imageAEl.href = imageUrl;
      imageAEl.innerText = imageUrl;
      image.replaceWith(imageAEl);
    });

    main.append(buildSectionMetadata([['Style', 'newsdetail, no-button']]));
    main.append(blockSeparator().cloneNode(true));

    params['breadcrumbs-base'] = '/news/news-breadcrumbs';
    params['breadcrumbs-title-override'] = 'News Post';

    Object.keys(listMetadata).forEach((key) => {
      if (listMetadata[key] && listMetadata[key].length > 0) {
        params[key] = listMetadata[key];
      }
    });

    createMetadata(main, document, params);

    const urlName = getUrlName(title, publishDate);

    results.push({
      element: main,
      path: `/news/${normalizeCategory}/${year}/${urlName}`,
    });

    return results;
  },
};
