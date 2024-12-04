import { div, section } from '../../scripts/dom-helpers.js';
import { normalizeString } from '../../scripts/utils.js';

const childCalendars = [
  'County Commissioners',
  'County Commission District A',
  'County Commission District B',
  'County Commissioners District C',
  'County Commissioners District D',
];

// Fetching events from individual calendar sheets
export async function fetchPlaceholders(prefix) {
  window.placeholders = window.placeholders || {};
  const TRANSLATION_KEY = prefix;
  const loaded = window.placeholders[`${TRANSLATION_KEY}-loaded`];

  if (!loaded) {
    window.placeholders[`${TRANSLATION_KEY}-loaded`] = new Promise((resolve) => {
      fetch(`/calendar/${prefix}/${prefix}.json?sheet=events`)
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

async function initializeCalendar() {
  let eventsData = [];
  const calendarEl = document.getElementById('calendar');
  // const data = getEventsManual();
  childCalendars.forEach(async (childCalendar, i) => {
    const normalizeCalendar = normalizeString(childCalendar);
    const placeholders = await fetchPlaceholders(normalizeCalendar);
    eventsData = [...eventsData, ...placeholders.data];
    if (i === childCalendars.length - 1) {
      // eslint-disable-next-line no-undef
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        },
        navLinks: true, // can click day/week names to navigate views
        editable: true,
        selectable: true,
        dayMaxEvents: true,
        events: eventsData,
        eventTimeFormat: { hour: 'numeric', minute: '2-digit' },
      });
      calendar.render();
    }
  });
}

export function loadfullcalendar() {
  const scriptfullcalendar = document.createElement('script');
  scriptfullcalendar.setAttribute('type', 'text/javascript');
  scriptfullcalendar.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js';
  scriptfullcalendar.addEventListener('load', initializeCalendar);
  document.head.append(scriptfullcalendar);
}

export default async function decorate(doc) {
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
}
