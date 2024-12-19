import {
  div, iframe, section, p, button, a,
} from '../../scripts/dom-helpers.js';

class Obj {
  // eslint-disable-next-line max-len
  constructor(title, start, end, allDay, daysOfWeek, startTime, endTime, startRecur, endRecur, url, backgroundColor, classNames, readMore) {
    this.title = title;
    this.start = start;
    this.end = end;
    this.allDay = allDay;
    this.daysOfWeek = daysOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
    this.startRecur = startRecur;
    this.endRecur = endRecur;
    this.url = url;
    this.backgroundColor = backgroundColor;
    this.classNames = classNames;
    this.readMore = readMore;
  }
}

// Fetching events from individual calendar sheets
export async function fetchPlaceholders(prefix) {
  window.placeholders = window.placeholders || {};
  const TRANSLATION_KEY = prefix;
  const loaded = window.placeholders[`${TRANSLATION_KEY}-loaded`];

  if (!loaded) {
    window.placeholders[`${TRANSLATION_KEY}-loaded`] = new Promise((resolve) => {
      fetch(`/calendar/${prefix}.json`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        })
        .then((json) => {
          window.placeholders[prefix] = json;
          resolve(window.placeholders[prefix]);
        })
        .catch(() => {
          // error loading placeholders
          window.placeholders[prefix] = {};
          resolve(window.placeholders[prefix]);
        });
    });
  }
  await window.placeholders[`${TRANSLATION_KEY}-loaded`];
  return window.placeholders[`${TRANSLATION_KEY}`];
}

function createModal(doc) {
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
  doc.body.append(modal);
}

function tConv24(time24) {
  let ts = time24;
  const H = +ts.substr(0, 2);
  let h = (H % 12) || 12;
  h = (h < 10) ? (`0${h}`) : h; // leading 0 at the left for 1 digit hours
  const ampm = H < 12 ? ' AM' : ' PM';
  ts = h + ts.substr(2, 3) + ampm;
  return ts;
}

function popupEvent(url, startTime, endTime, backgroundColor, readMore) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE',
    'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];
  let eventDate = startTime.getDate();
  if (eventDate < 10) {
    eventDate = `0${eventDate}`;
  }
  const eventMonth = startTime.getMonth();
  const eventStartHours = startTime.toString().split(' ')[4].split(':')[0];
  const eventStartMinutes = startTime.toString().split(' ')[4].split(':')[1];
  const eventStartTime = tConv24(`${eventStartHours}:${eventStartMinutes}`);
  const eventEndHours = endTime.toString().split(' ')[4].split(':')[0];
  const eventEndMinutes = endTime.toString().split(' ')[4].split(':')[1];
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

function createEvents(calendar, importedData, eventsList) {
  importedData.forEach((event) => {
    const startTime = event.startRecur.split('T')[1];
    const endTime = event.endRecur.split('T')[1];
    const url = window.location.origin + event.path;
    const eventObj = new Obj(event.title, event.start, event.end, event.allDay, event.daysOfWeek, startTime, endTime, event.startRecur, event.endRecur, url, event['division-color'], event.classNames, event.readMore);
    eventsList.push(eventObj);
  });
  eventsList.forEach((event) => {
    if (event.daysOfWeek.length > 0) {
      calendar.addEvent({
        title: event.title,
        allDay: false,
        daysOfWeek: event.daysOfWeek,
        startTime: event.startTime,
        endTime: event.endTime,
        startRecur: event.startRecur,
        endRecur: event.endRecur,
        url: event.url,
        backgroundColor: event.backgroundColor,
        classNames: event.classNames,
        extendedProps: { readMore: event.readMore },
      });
    } else {
      calendar.addEvent({
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        url: event.url,
        backgroundColor: event.backgroundColor,
        classNames: event.classNames,
        extendedProps: { readMore: event.readMore },
      });
    }
  });
}

async function initializeCalendar() {
  let importedData = [];
  const eventsList = [];
  const calendarEl = document.getElementById('calendar');
  // const data = getEventsManual();
  const normalizeCalendar = 'events';
  const placeholders = await fetchPlaceholders(normalizeCalendar);
  importedData = [...importedData, ...placeholders.data];
  // eslint-disable-next-line no-undef
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next,today dayGridMonth,timeGridWeek,timeGridDay,list',
      center: '',
      right: 'title',
    },
    navLinks: true, // can click day/week names to navigate views
    editable: true,
    selectable: true,
    dayMaxEvents: true,
    // events: importedData,
    eventTimeFormat: { hour: 'numeric', minute: '2-digit' },
    eventClick: (info) => {
      info.jsEvent.preventDefault(); // don't let the browser navigate
      if (info.event.url) {
        // eslint-disable-next-line max-len
        popupEvent(info.event.url, info.event.start, info.event.end, info.event.backgroundColor, info.event.extendedProps.readMore);
      }
    },
  });
  calendar.render();

  createEvents(calendar, importedData, eventsList);
}

export function loadfullcalendar() {
  const scriptfullcalendar = document.createElement('script');
  scriptfullcalendar.setAttribute('type', 'text/javascript');
  scriptfullcalendar.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js';
  scriptfullcalendar.addEventListener('load', initializeCalendar);
  document.head.append(scriptfullcalendar);
}

export default async function decorate(doc) {
  doc.body.classList.add('calendar');
  const $main = doc.querySelector('main');
  const $mainChildren = Array.from($main.childNodes);
  const $section = section();
  const $calendarSection = section();

  $mainChildren.forEach((child) => {
    $section.appendChild(child);
  });

  $main.appendChild($section);
  const calDiv = div({ id: 'calendar' });
  $calendarSection.append(calDiv);
  $main.append($calendarSection);
  loadfullcalendar();
  createModal(doc);
}
