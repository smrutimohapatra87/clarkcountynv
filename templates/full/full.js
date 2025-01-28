export default async function decorate(doc) {
  const aElems = doc.querySelectorAll('a.button');
  aElems.forEach((aElem) => {
    aElem.classList.remove('button');
  });
}
