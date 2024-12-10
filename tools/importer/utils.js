/* global WebImporter */

export const PREVIEW_DOMAIN = 'https://main--clarkcountynv--aemsites.aem.page';

export const createMetadata = (main, document, params) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  if (params.preProcessMetadata && Object.keys(params.preProcessMetadata).length) {
    Object.assign(meta, params.preProcessMetadata);
  }

  if (params.template) {
    meta.template = params.template;
  }

  if (params['breadcrumbs-base']) {
    meta['breadcrumbs-base'] = params['breadcrumbs-base'];
  }

  if (params['breadcrumbs-current']) {
    meta['breadcrumbs-current'] = params['breadcrumbs-current'];
  }

  const image = document.createElement('img');
  image.src = `${PREVIEW_DOMAIN}/assets/images/logo.png`;
  meta.Image = image;
  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

export const fixRelativeLinks = (document) => {
  document.querySelectorAll('a').forEach((a) => {
    const url = new URL(a.href);
    if (url.pathname) {
      a.href = PREVIEW_DOMAIN + url.pathname;
    }
  });
};

export const getPathSegments = (url) => (new URL(url)).pathname.split('/')
  .filter((segment) => segment);

export const normalizeString = (str) => str.toLowerCase().replace(/ /g, '_');

export const fetchAndParseDocument = async (url) => {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching and parsing document:', error);
  }
  return null;
};
