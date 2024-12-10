export default async function decorate(doc) {
  const aElems = doc.querySelectorAll('.agendadetail a');
  aElems.forEach((aElem) => {
    aElem.classList.remove('button');
    aElem.setAttribute('target', '_blank');
  });
}
