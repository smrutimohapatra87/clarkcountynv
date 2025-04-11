/* global WebImporter */
/* eslint-disable no-console */
import {
  createMetadata,
  blockSeparator,
  buildSectionMetadata,
  PREVIEW_DOMAIN, WEBFILES_DOMAIN, getSanitizedPath,
} from './utils.js';

function parseRRule(rruleString) {
  const rruleLines = rruleString.split('\n');
  let frequency = '';
  let daysOfWeek = '';
  let excludeDates = [];
  let until = '';

  rruleLines.forEach((line) => {
    if (line.startsWith('RRULE:')) {
      const ruleParts = line.replace('RRULE:', '').split(';');
      let byDay = '';
      let bySetPos = '';

      ruleParts.forEach((part) => {
        const [key, value] = part.split('=');

        if (key === 'FREQ') {
          frequency = value;
        } else if (key === 'BYDAY') {
          byDay = value;
        } else if (key === 'BYSETPOS') {
          bySetPos = value;
        } else if (key === 'UNTIL') {
          // Convert UNTIL from format like 20250826T130000Z to 2025-08-26T13:00:00
          const dateStr = value.replace('Z', '');
          until = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}T${dateStr.substring(9, 11)}:${dateStr.substring(11, 13)}:${dateStr.substring(13, 15)}`;
        }
      });

      // Handle both cases
      if (byDay && bySetPos) {
        daysOfWeek = `${byDay}(${bySetPos})`;
      } else if (byDay) {
        daysOfWeek = byDay;
      }
    } else if (line.startsWith('EXDATE:')) {
      excludeDates = line.replace('EXDATE:', '')
        .split(',')
        .map((date) => date.substring(0, 8)) // Extract YYYYMMDD
        .map((date) => `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`); // Format YYYY-MM-DD
    }
  });

  return {
    frequency,
    daysOfWeek,
    until,
    excludeDates: excludeDates.join(','),
  };
}

export const getEventBlock = (name) => buildSectionMetadata([
  ['Style', name], //
]);

export const createEmptyBlock = (name) => {
  const block = WebImporter.Blocks.createBlock(document, {
    name,
    cells: [[' ']],
  });
  return block;
};

function getNewImageLink(imageSrc, pathPrefix, results) {
  const originalLocation = new URL(imageSrc, WEBFILES_DOMAIN);
  const newPath = `/assets/images${pathPrefix}${WebImporter.FileUtils.sanitizePath(originalLocation.pathname.split('/').pop())}`.toLowerCase();
  results.push({
    path: newPath,
    from: originalLocation.toString(),
  });
  // Image end

  return new URL(newPath, PREVIEW_DOMAIN).toString();
}

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

const DESCRIPTION = 'description';
const MAP_LOCATION = 'Map-location';
const EVENT_FOOTER = 'Event-footer';
const BASE_PATH = '/calendar/';
const BASE_MAP = 'https://www.google.com/maps/embed/v1/place?key=AIzaSyC5cMe92Yw3JgHrkvgIyHgdS2lTsH4C95k&q=';

function isExternalLink(url) {
  const link = new URL(url, window.location.origin);
  const internalLinks = ['cms8.revize.com', 'www.clarkcountynv.gov', 'localhost'];
  return !internalLinks.some((domain) => link.hostname.includes(domain));
}

export default {

  transform: async ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const results = [];
    const eventToImport = params.originalURL.split('#')[1];

    // Read events.json from the same directory as import-events.js
    let eventsJsonData;

    try {
      // Using relative path since events.json is in the same directory
      const eventsJsonPath = new URL('./all_filtered_events.json', import.meta.url);
      const response = await fetch(eventsJsonPath);
      eventsJsonData = await response.json();
    } catch (error) {
      console.error('Error reading events.json:', error);
      eventsJsonData = {}; // Provide a default empty object in case of error
    }

    const eventJson = eventsJsonData[eventToImport];
    console.log('Processing event', eventJson);
    const pathPrefix = WebImporter.FileUtils.sanitizePath(
      BASE_PATH + eventJson.primary_calendar_name,
    );
    const newPagePath = `${pathPrefix}/${WebImporter.FileUtils.sanitizeFilename(`${eventJson.title.toLowerCase()}-${eventJson.start.toLowerCase()}`)}`;

    const main = document.createElement('body');

    // Hero Image start
    const imageEl = Document.parseHTMLUnsafe(eventJson.image).querySelector('img');
    const imageSrc = imageEl.src;
    let heroImgSrc = 'https://main--clarkcountynv--aemsites.aem.page/assets/images/calendar/default-event.jpg';
    if (imageSrc.search('/v2/images/placeholder.png') === -1) {
      heroImgSrc = getNewImageLink(imageSrc, pathPrefix, results);
    }
    const heroImage = document.createElement('a');
    heroImage.href = heroImgSrc;
    heroImage.textContent = heroImgSrc;
    main.append(heroImage);
    // Hero Image end

    main.append(createEmptyBlock('hero (date)'));
    main.append(createEmptyBlock('hero (time)'));
    main.append(getEventBlock('hero'));
    main.append(blockSeparator().cloneNode(true));
    main.append(getEventBlock('title'));
    main.append(blockSeparator().cloneNode(true));

    const descriptionEl = document.createElement('div');
    const desc = decodeURIComponent(eventJson.desc);
    descriptionEl.innerHTML = desc;
    const descImages = descriptionEl.querySelectorAll('img');
    descImages.forEach((descImg) => {
      const imgSrc = getNewImageLink(descImg.getAttribute('src'), pathPrefix, results);
      const imgLink = document.createElement('a');
      imgLink.href = imgSrc;
      imgLink.textContent = imgSrc;
      descImg.replaceWith(imgLink);
    });
    main.append(descriptionEl);
    main.append(getEventBlock(DESCRIPTION));
    main.append(blockSeparator().cloneNode(true));

    if (eventJson.location) { // if there is no location for ex. 4th July Independence day
      const mapEl = document.createElement('a');
      mapEl.href = BASE_MAP + encodeURI(eventJson.location);
      mapEl.textContent = BASE_MAP + encodeURI(eventJson.location);
      const mapEmbedBlock = WebImporter.Blocks.createBlock(document, {
        name: 'map-embed',
        cells: [[mapEl]],
      });
      main.append(mapEmbedBlock);
      main.append(getEventBlock(MAP_LOCATION));
      main.append(blockSeparator().cloneNode(true));
    }

    if (eventJson.url) {
      const readMoreLink = document.createElement('a');
      let finalReadMoreUrl;
      if (isExternalLink(eventJson.url)) {
        finalReadMoreUrl = eventJson.url;
      } else {
        let linkSrc = eventJson.url;
        if (linkSrc.startsWith('http://cms8.revize.com/revize/clarknv')) {
          linkSrc = eventJson.url.replace('http://cms8.revize.com/revize/clarknv', 'https://www.clarkcountynv.gov');
        }
        const sanitizedPath = new URL(getSanitizedPath(linkSrc), PREVIEW_DOMAIN);
        finalReadMoreUrl = new URL(sanitizedPath.pathname, PREVIEW_DOMAIN).toString();
      }
      readMoreLink.href = finalReadMoreUrl;
      readMoreLink.textContent = finalReadMoreUrl;
      main.append(readMoreLink);
      params.readMore = readMoreLink;
      results.push({
        path: newPagePath,
        report: {
          readMoreFrom: eventJson.url,
          readMoreTo: finalReadMoreUrl,
        },
      });
    }
    main.append(getEventBlock(EVENT_FOOTER));
    main.append(blockSeparator().cloneNode(true));

    // calenders display
    params.divisionName = calendarProps[eventJson.calendar_displays[0]]?.name;
    if (eventJson.calendar_displays && eventJson.calendar_displays.length > 1) {
      const eventDivisions = eventJson.calendar_displays;
      const names = eventDivisions
        .map((id) => calendarProps[id]?.name) // Map ids to their names
        .filter((name) => name) // Filter out undefined names
        .join(', ');
      params.divisionName = names;
    }

    params.eventStart = eventJson.start;
    params.duration = eventJson.duration ? `T${eventJson.duration}:00` : '';
    if (eventJson.rrule) {
      const rrule = parseRRule(eventJson.rrule);
      params.freq = rrule.frequency;
      params.daysOfWeek = rrule.daysOfWeek;
      params.excludeDates = rrule.excludeDates;
      if (rrule.until) {
        params.eventStop = rrule.until || ''; // Ideally we should support until in rrule
      } /* else {
        const startDate = new Date(params.eventStart);
        startDate.setFullYear(startDate.getFullYear() + 5);
        params.eventStop = startDate.toISOString().substring(0, 19);
      } */
    } else if (eventJson.end) {
      params.eventStop = eventJson.end;
    }
    if (!params.eventStop && params.allDay) {
      console.log('Not setting eventStop for single allDay event');
    }

    params.featuredImage = heroImage.cloneNode(true);
    params.template = 'event';
    params.featuredTitle = eventJson.title;
    params.title = eventJson.title;
    params.featuredDescription = descriptionEl.cloneNode(true);
    params.allDay = Boolean(eventJson.allDay) || false;
    createMetadata(main, document, params);

    results.push({
      element: main,
      path: newPagePath,
    });

    return results;
  },
};
