import {
  div, h3, iframe, p, button, a,
  img,
} from '../../scripts/dom-helpers.js';

import {
  createOptimizedPicture, buildBlock, decorateBlock, loadBlock,
} from '../../scripts/aem.js';

import { normalizeString } from '../../scripts/utils.js';

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];
let divisions = [];

function tConv24(time24) {
  let ts = time24;
  const H = +ts.substr(0, 2);
  let h = (H % 12) || 12;
  h = (h < 10) ? (`0${h}`) : h; // leading 0 at the left for 1 digit hours
  const ampm = H < 12 ? ' AM' : ' PM';
  ts = h + ts.substr(2, 3) + ampm;
  return ts;
}

function popupEvent(url, startTime, endTime, duration, backgroundColor, readMore) {
  const sourceDate = startTime;
  const endDate = endTime;
  let eventEndTime = '';
  const dateStartObj = new Date(sourceDate);
  const dateEndObj = new Date(endDate);
  let eventDate = dateStartObj.getDate();
  if (eventDate < 10) {
    eventDate = `0${eventDate}`;
  }
  const eventMonth = dateStartObj.getMonth();
  const eventStartHours = dateStartObj.toString().split(' ')[4].split(':')[0];
  const eventStartMinutes = dateStartObj.toString().split(' ')[4].split(':')[1];
  const eventStartTime = tConv24(`${eventStartHours}:${eventStartMinutes}`);

  // Calculating the end time after adding the duration in hh:mm format
  if (duration.length > 1) {
    const hr = duration.split('T')[1].split(':')[0];
    const min = duration.split('T')[1].split(':')[1];
    const eventEndHours = dateEndObj.toString().split(' ')[4].split(':')[0];
    const eventEndMinutes = dateEndObj.toString().split(' ')[4].split(':')[1];
    let totalHours = parseInt(hr, 10) + parseInt(eventEndHours, 10);
    let totalMinutes = parseInt(min, 10) + parseInt(eventEndMinutes, 10);
    if (totalMinutes > 59) {
      const newMinutes = totalMinutes - 60;
      totalHours += 1;
      totalMinutes = newMinutes;
    }
    if (totalHours > 23) {
      totalHours -= 24;
    }
    eventEndTime = tConv24(`${totalHours.toString()}:${totalMinutes.toString()}`);
  } else {
    const eventEndHours = dateEndObj.toString().split(' ')[4].split(':')[0];
    const eventEndMinutes = dateEndObj.toString().split(' ')[4].split(':')[1];
    eventEndTime = tConv24(`${eventEndHours}:${eventEndMinutes}`);
  }

  // convert number into Month name
  const eventMonthName = months[eventMonth];

  const modal = document.querySelector('.event-modal');
  modal.querySelector('.event-modal-date').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-time').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer button.close').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer').classList.add('off');
  modal.querySelector('.event-modal-date p:first-child').textContent = `${eventDate}`;
  modal.querySelector('.event-modal-date p:last-child').textContent = `${eventMonthName}`;
  modal.querySelector('.event-modal-time p').textContent = `${eventStartTime} - ${eventEndTime}`;
  modal.querySelector('iframe').src = url;
  modal.style.display = 'block';
  if (readMore.length > 1) {
    modal.querySelectorAll('.event-modal-footer a').forEach((ele) => {
      ele.remove();
    });
    const readMoreEle = a('Read More');
    readMoreEle.href = readMore;
    modal.querySelector('.event-modal-footer').appendChild(readMoreEle);
    modal.querySelector('.event-modal-footer a').style.backgroundColor = backgroundColor;
  }

  // Listen for messages from iframe window
  window.addEventListener('message', (event) => {
    if (event.data.eventtop === 'off') {
      modal.querySelector('.event-modal-date').classList.add('off');
      modal.querySelector('.event-modal-time').classList.add('off');
    } else {
      modal.querySelector('.event-modal-date').classList.remove('off');
      modal.querySelector('.event-modal-time').classList.remove('off');
    }
    if (event.data.eventfooter === 'on') {
      modal.querySelector('.event-modal-footer').classList.remove('off');
    } else {
      modal.querySelector('.event-modal-footer').classList.add('off');
    }
  });

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
      modal.querySelectorAll('.event-modal-footer a').forEach((ele) => {
        ele.remove();
      });
    }
  };
}

// Result parsers parse the query results into a format that can be used by the block builder for
// the specific block types
const resultParsers = {
  // Parse results into a cards block
  columns: (results) => {
    const blockContents = [];
    let sourceDate = '';
    results.forEach((result) => {
      const row = [];
      const divLeft = div({ class: 'event-image' });
      if (result.image.length > 1) {
        const columnImage = createOptimizedPicture(result.image);
        divLeft.appendChild(columnImage);
      } else {
        const columnImage = createOptimizedPicture('/assets/images/general/media_1777f18b0073109f55dbd10b12552b5115288e89b.png');
        divLeft.appendChild(columnImage);
      }
      const divRight = div({ class: 'event-body' });
      if (result.start.length === 0) {
        sourceDate = result.startRecur;
      } else {
        sourceDate = result.start;
      }
      const eventMonth = sourceDate.split('T')[0].split('-')[1] - 1;
      const eventMonthName = months[parseInt(eventMonth, 10)];
      const eventYear = sourceDate.split('T')[0].split('-')[0];
      const eventDate = sourceDate.split('T')[0].split('-')[2];
      const fullDate = `${eventMonthName} ${eventDate}, ${eventYear}`;
      const dateDiv = div({ class: 'date' }, fullDate);
      const divTitle = div({ class: 'title' }, h3(result.title));
      const divDescription = div({ class: 'description' }, result.eventdescription);
      const divPath = div({ class: 'path' }, result.path);
      divRight.appendChild(dateDiv);
      divRight.appendChild(divTitle);
      divRight.appendChild(divDescription);
      divRight.appendChild(divPath);
      const columnBody = div({ class: 'event' });
      columnBody.addEventListener('click', () => {
        const url = window.location.origin + result.path;
        divisions.forEach((division) => {
          if (normalizeString(division.name) === normalizeString(result.divisionname)) {
            result['division-color'] = division.color;
          }
        });
        popupEvent(url, result.start, result.end, result.duration, result['division-color'], result.readMore);
      });
      columnBody.appendChild(divLeft);
      columnBody.appendChild(divRight);
      row.push(columnBody);
      blockContents.push(row);
    });
    return blockContents;
  },
};

// Fetching events from individual calendar sheets
export async function fetchPlaceholders() {
  window.placeholders = window.placeholders || {};
  const KEY = 'events';
  const loaded = window.placeholders[`${KEY}-loaded`];

  if (!loaded) {
    window.placeholders[`${KEY}-loaded`] = new Promise((resolve) => {
      fetch(`/calendar/${KEY}.json?sheet=default&sheet=divisions`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        })
        .then((json) => {
          window.placeholders.calendarevents = json.default;
          window.placeholders.divisions = json.divisions;
          resolve(window.placeholders[KEY]);
        })
        .catch(() => {
          // error loading placeholders
          window.placeholders[KEY] = {};
          resolve(window.placeholders[KEY]);
        });
    });
  }
  await window.placeholders[`${KEY}-loaded`];
  return window.placeholders;
}

function createModal(block) {
  const modal = div({ class: 'event-modal' }, div(
    { class: 'event-modal-content' },
    iframe({
      id: 'event-iframe',
      width: '100%',
      height: '100%',
    }),
    div({ class: 'event-modal-date' }, p(), p()),
    div({ class: 'event-modal-time' }, p()),
    div({ class: 'event-modal-footer' }, button({ class: 'close', onclick: () => { document.querySelector('.event-modal').style.display = 'none'; } }, 'Close')),
  ));
  block.append(modal);
}

function priorDate(date) {
  const today = new Date();
  const eventDate = new Date(date);
  return eventDate < today;
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const yesArray = placeholders.calendarevents.data.filter((item) => item.featured === 'yes' && !priorDate(item.start));
  // Sort via dates
  yesArray.sort((x, y) => new Date(x.start) - new Date(y.start));
  divisions = placeholders.divisions.data;
  const blockContents = resultParsers.columns(yesArray.slice(0, 4));
  const builtBlock = buildBlock('columns', blockContents);
  block.appendChild(builtBlock);
  const seeMoreButton = div({ class: 'see-more' }, a({ href: '/calendar' }, 'Discover More', img({ src: '/assets/images/general/white-arrow-right.png', alt: 'more' })));
  block.appendChild(seeMoreButton);
  decorateBlock(builtBlock);
  await loadBlock(builtBlock);
  createModal(block);
}
