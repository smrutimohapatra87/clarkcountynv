export default async function decorate(doc) {
  doc.querySelector('header').classList.add('displayoff');
  doc.querySelector('footer').classList.add('displayoff');
  doc.body.classList.add('search');
}
