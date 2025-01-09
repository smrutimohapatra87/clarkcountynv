export default function decorate(block) {
  [...block.children].forEach((row) => {
    const leftNavDetailsEl = row.querySelector('div');
    if (leftNavDetailsEl) {
      leftNavDetailsEl.className = 'leftnav-info-card';
    }
  });
}
