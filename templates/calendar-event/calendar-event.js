// eslint-disable-next-line no-unused-vars,no-empty-function

export default async function decorate(doc) {
  doc.querySelector('header').remove();
  doc.querySelector('footer').remove();
  doc.body.classList.add('calendar-event');
}
