import {
  div, h3, iframe, p, button, a,
} from '../../scripts/dom-helpers.js';

import {
  createOptimizedPicture, buildBlock, decorateBlock, loadBlock,
} from '../../scripts/aem.js';

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];

function tConv24(time24) {
  let ts = time24;
  const H = +ts.substr(0, 2);
  let h = (H % 12) || 12;
  h = (h < 10) ? (`0${h}`) : h; // leading 0 at the left for 1 digit hours
  const ampm = H < 12 ? ' AM' : ' PM';
  ts = h + ts.substr(2, 3) + ampm;
  return ts;
}

function popupEvent(url, startTime, startRecur, endTime, endRecur, backgroundColor, readMore) {
  let sourceDate = '';
  let endDate = '';
  if (startTime.length === 0) {
    sourceDate = startRecur;
    endDate = endRecur;
  } else {
    sourceDate = startTime;
    endDate = endTime;
  }
  const dateStartObj = new Date(sourceDate.split('T')[0]);
  const dateEndObj = new Date(endDate.split('T')[0]);
  let eventDate = dateStartObj.getDate();
  if (eventDate < 10) {
    eventDate = `0${eventDate}`;
  }
  const eventMonth = dateStartObj.getMonth();
  const eventStartHours = dateStartObj.toString().split(' ')[4].split(':')[0];
  const eventStartMinutes = dateStartObj.toString().split(' ')[4].split(':')[1];
  const eventStartTime = tConv24(`${eventStartHours}:${eventStartMinutes}`);
  const eventEndHours = dateEndObj.toString().split(' ')[4].split(':')[0];
  const eventEndMinutes = dateEndObj.toString().split(' ')[4].split(':')[1];
  const eventEndTime = tConv24(`${eventEndHours}:${eventEndMinutes}`);

  // convert number into Month name
  const eventMonthName = months[eventMonth];

  const modal = document.querySelector('.event-modal');
  modal.querySelector('.event-modal-date').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-time').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer button.ics').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer button.close').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer a').style.backgroundColor = backgroundColor;
  modal.querySelector('.event-modal-footer').classList.add('off');
  modal.querySelector('.event-modal-date p:first-child').textContent = `${eventDate}`;
  modal.querySelector('.event-modal-date p:last-child').textContent = `${eventMonthName}`;
  modal.querySelector('.event-modal-time p').textContent = `${eventStartTime} - ${eventEndTime}`;
  modal.querySelector('iframe').src = url;
  modal.style.display = 'block';
  if (readMore.length > 0) {
    modal.querySelector('.event-modal-footer a').href = readMore;
    modal.querySelector('.event-modal-footer a').classList.remove('displayoff');
  } else {
    modal.querySelector('.event-modal-footer a').classList.add('displayoff');
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
    console.log(event.data.eventfooter);
    if (event.data.eventfooter === 'on') {
      modal.querySelector('.event-modal-footer').classList.remove('off');
    } else {
      modal.querySelector('.event-modal-footer').classList.add('off');
    }
  });

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
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
      const columnImage = createOptimizedPicture(result.image);
      divLeft.appendChild(columnImage);
      const divRight = div({ class: 'event-body' });
      if (result.start.length === 0) {
        sourceDate = result.startRecur;
      } else {
        sourceDate = result.start;
      }
      const dateObj = new Date(sourceDate.split('T')[0]);
      const eventDate = dateObj.getDate();
      const eventMonth = dateObj.getMonth();
      // convert number into Month name
      const eventMonthName = months[eventMonth];
      const eventYear = dateObj.getFullYear();
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
        popupEvent(url, result.start, result.startRecur, result.end, result.endRecur, result['division-color'], result.readMore);
      });
      columnBody.appendChild(divLeft);
      columnBody.appendChild(divRight);
      row.push(columnBody);
      blockContents.push(row);
    });
    return blockContents;
  },
};

export async function fetchPlaceholders() {
  window.placeholders = window.placeholders || {};
  const TRANSLATION_KEY_EVENTS = 'events';
  const loaded = window.placeholders[`${TRANSLATION_KEY_EVENTS}-loaded`];

  if (!loaded) {
    window.placeholders[`${TRANSLATION_KEY_EVENTS}-loaded`] = new Promise((resolve, reject) => {
      fetch('/featured.json?sheet=events')
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          throw new Error(`${resp.status}: ${resp.statusText}`);
        })
        .then((json) => {
          window.placeholders[TRANSLATION_KEY_EVENTS] = json;
          resolve();
        }).catch((error) => {
        // Error While Loading Placeholders
          window.placeholders[TRANSLATION_KEY_EVENTS] = {};
          reject(error);
        });
    });
  }
  await window.placeholders[`${TRANSLATION_KEY_EVENTS}-loaded`];
  return [window.placeholders[TRANSLATION_KEY_EVENTS]];
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
    div({ class: 'event-modal-footer' }, button({ class: 'ics' }, 'ICS'), button({ class: 'close', onclick: () => { document.querySelector('.event-modal').style.display = 'none'; } }, 'Close'), a('Read More')),
  ));
  block.append(modal);
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const yesArray = placeholders[0].data.filter((item) => item.featured === 'yes');
  const blockContents = resultParsers.columns(yesArray);
  const builtBlock = buildBlock('columns', blockContents);
  block.appendChild(builtBlock);
  decorateBlock(builtBlock);
  await loadBlock(builtBlock);
  createModal(block);
}
