/* global WebImporter */
import {
  createMetadata,
  blockSeparator,
  buildSectionMetadata,
  getDesktopBgBlock,
  getMobileBgBlock,
} from './utils.js';

const calendarProps = {
  1: { color: '#312222', name: 'Events' },
  6: { color: '#3787D8', name: 'County Commissioners' },
  13: { color: '#DA80C1', name: 'County Commission District A' },
  14: { color: '#C0A6DD', name: 'County Commission District B' },
  15: { color: '#48E7E2', name: 'County Commissioners District C' },
  16: { color: '#7AD295', name: 'County Commissioners District D' },
  17: { color: '#D4DBB6', name: 'County Commissioners District E' },
  18: { color: '#F9A97F', name: 'County Commissioners District F' },
  19: { color: '#2619E4', name: 'County Commissioners District G' },
  21: { color: '', name: 'calendar-list-options' },
  22: { color: '#FF8600', name: 'Goodsprings Citizens Advisory Committee' },
  24: { color: '#37D84E', name: 'Laughlin TAB' },
  26: { color: '#7237D8', name: 'Lone Mountain Citizens Advisory Council' },
  28: { color: '#D837D2', name: 'Lower Kyle Canyon Citizens Advisory Committee' },
  30: { color: '#9D484D', name: 'Moapa Town Advisory Board' },
  32: { color: '#058089', name: 'Paradise Town Advisory Board' },
  33: { color: '#3A9500', name: 'Spring Valley Town Advisory Board' },
  34: { color: '#3C8C98', name: 'Winchester Town Advisory Board' },
  35: { color: '#D5CD70', name: 'Enterprise Town Advisory Board' },
  36: { color: '#89B5BC', name: 'Moapa Valley Town Advisory Board' },
  37: { color: '#FE0000', name: 'Red Rock Citizens Advisory Committee' },
  38: { color: '#37D891', name: 'Searchlight Town Advisory Board' },
  39: { color: '#B4ADA6', name: 'Bunkerville Town Advisory Board' },
  40: { color: '#F3BBEA', name: 'Mount Charleston Town Advisory Board' },
  41: { color: '#DADD32', name: 'Sunrise Manor Town Advisory Board' },
  42: { color: '#07CAF7', name: 'Whitney Town Advisory Board' },
  43: { color: '#047C6D', name: 'PC' },
  44: { color: '#9086D8', name: 'BCC' },
  45: { color: '#6AA85A', name: 'Mountain Springs Citizens Advisory Council' },
  47: { color: '#069874', name: 'Indian Springs Town Advisory Board' },
  49: { color: '#51277C', name: 'Sandy Valley Citizens Advisory Council Meeting' },
  52: { color: '#3787D8', name: 'Wetlands Park' },
  53: { color: '#3787D8', name: 'Working Group to Address Homelessness' },
  54: { color: '#EDF77F', name: 'County Manager' },
  55: { color: '#DDC08F', name: 'Parks & Recreation' },
  56: { color: '#3787D8', name: 'American Rescue Plan Act' },
  57: { color: '#37D847', name: 'Truancy Prevention Outreach Program' },
  61: { color: '#3787D8', name: 'CJCC' },
  62: { color: '#F26D1E', name: 'Mojave Max and DCP Outreach Events / Volunteer Opportunities' },
  64: { color: '#3787D8', name: 'Featured Events' },
  65: { color: '#3787D8', name: 'Family Services' },
  66: { color: '#3787D8', name: 'Independent Living' },
};

const BASE_PATH = '/calendar/';

export default {

  transform: async ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const results = [];
    const eventToImport = params.originalURL.split('#')[1];

    const divisionName = calendarProps[eventToImport]?.name;

    const newPagePath = WebImporter.FileUtils.sanitizePath(`${BASE_PATH + divisionName}/index`);

    const main = document.createElement('body');
    const desktopBlock = getDesktopBgBlock('');
    const mobileBlock = getMobileBgBlock('');
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(mobileBlock, main.firstChild);
    main.insertBefore(blockSeparator().cloneNode(true), main.firstChild);
    main.insertBefore(desktopBlock, main.firstChild);

    main.append(buildSectionMetadata([['Style', 'search']]));
    main.append(blockSeparator().cloneNode(true));

    params['page-title'] = `Calendar - ${divisionName}`;
    params.template = 'calendar';
    params['breadcrumbs '] = false;
    createMetadata(main, document, params);

    results.push({
      element: main,
      path: newPagePath,
    });
    return results;
  },
};
