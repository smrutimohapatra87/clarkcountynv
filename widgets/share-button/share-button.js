function widget() {
  // widget for share modal launch
  const a = document.createElement('a');
  const img = document.createElement('div');
  const txt = document.createElement('span');

  img.innerHTML = '<img data-icon-name="share" src="/icons/icons8-share-18.svg" alt="" loading="lazy">';
  a.setAttribute('href', '/modals/share-with-social-network');
  a.setAttribute('class', 'floating-share-btn');
  a.append(img);
  txt.innerHTML = 'Share';
  a.append(txt);
  (document.body || document.head).appendChild(a);
}

widget();
