const tracker = [];

// Using the Web Animations API to animate the accordion
class Accordion {
  constructor(el) {
    // Store the <details> element
    this.el = el;
    // Store the <summary> element
    this.summary = el.querySelector('summary');
    // Store the parent <details> element
    this.parent = el.parentElement.parentElement;
    // Store the <div class="content"> element
    this.content = el.querySelector('.content');

    // Store the animation object (so we can cancel it if needed)
    this.animation = null;
    // Store if the element is closing
    this.isClosing = false;
    // Store if the element is expanding
    this.isExpanding = false;
    // Detect user clicks on the summary element
    this.summary.addEventListener('click', (e) => this.onClick(e));
  }

  onClick(e) {
    // Stop default behaviour from the browser
    e.preventDefault();
    // Add an overflow on the <details> to avoid content overflowing
    this.el.style.overflow = 'hidden';
    // Check if the element is being closed or is already closed
    if (this.isClosing || !this.el.open) {
      this.open();
    // Check if the element is being openned or is already open
    } else if (this.isExpanding || this.el.open) {
      this.shrink();
    }
  }

  shrink() {
    // Set the element as "being closed"
    this.isClosing = true;
    // Store the current height of the element
    const startHeight = `${this.el.offsetHeight}px`;
    // Calculate the height of the summary
    const endHeight = `${this.summary.offsetHeight}px`;
    // If there is already an animation running
    if (this.animation) {
      // Cancel the current animation
      this.animation.cancel();
    }
    // Start a WAAPI animation
    this.animation = this.el.animate({
      // Set the keyframes from the startHeight to endHeight
      height: [startHeight, endHeight],
    }, {
      duration: 500,
      easing: 'ease-out',
    });
    // When the animation is complete, call onAnimationFinish()
    this.animation.onfinish = () => this.onAnimationFinish(false);
    // If the animation is cancelled, isClosing variable is set to false
    // eslint-disable-next-line no-return-assign
    this.animation.oncancel = () => this.isClosing = false;
  }

  open() {
    // Apply a fixed height on the element
    this.el.style.height = `${this.el.offsetHeight}px`;
    // Force the [open] attribute on the details element
    this.el.open = true;
    // Wait for the next frame to call the expand function
    window.requestAnimationFrame(() => this.expand());
  }

  expand() {
    // Set the element as "being expanding"
    this.isExpanding = true;
    // Get the current fixed height of the element
    const startHeight = `${this.el.offsetHeight}px`;
    // Calculate the open height of the element (summary height + content height)
    const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;

    // If there is already an animation running
    if (this.animation) {
      // Cancel the current animation
      this.animation.cancel();
    }

    // Start a WAAPI animation
    this.animation = this.el.animate({
      // Set the keyframes from the startHeight to endHeight
      height: [startHeight, endHeight],
    }, {
      duration: 500,
      easing: 'ease-out',
    });
    // When the animation is complete, call onAnimationFinish()
    this.animation.onfinish = () => this.onAnimationFinish(true);
    // If the animation is cancelled, isExpanding variable is set to false
    // eslint-disable-next-line no-return-assign
    this.animation.oncancel = () => this.isExpanding = false;
  }

  onAnimationFinish(open) {
    // Set the open attribute based on the parameter
    this.el.open = open;
    // Clear the stored animation
    this.animation = null;
    // Reset isClosing & isExpanding
    this.isClosing = false;
    this.isExpanding = false;
    // Remove the overflow hidden and the fixed height
    this.el.style.height = '';
    this.el.style.overflow = '';
  }
}

function multilevelAccordion(mainUL) {
  mainUL.classList.add('content');
  const mainLIs = mainUL.children;
  for (let i = 0; i < mainLIs.length; i += 1) {
    const mainLI = mainLIs[i];
    const mainA = mainLI.querySelector('a');

    const details = document.createElement('details');
    details.classList.add('accordion-item');

    const summary = document.createElement('summary');
    summary.classList.add('accordion-item-label');
    const labelRight = document.createElement('div');
    labelRight.classList.add('markerdiv');
    const lablDiv = document.createElement('div');
    lablDiv.append(mainA, labelRight);
    summary.append(lablDiv);

    const childUL = mainLI.querySelector('ul');

    if (childUL) {
      details.append(summary, childUL);
      mainLI.replaceWith(details);
      multilevelAccordion(childUL);
    } else {
      details.append(summary);
      mainLI.replaceWith(details);
    }
  }
}

function findLevel(element) {
  let ele = element;
  let level = 0;
  while (ele.parentElement) {
    if (ele.parentElement.tagName === 'UL') {
      level += 1;
    }
    ele = ele.parentElement;
  }
  return level;
}

export default function decorate() {
  const mainUL = document.querySelector('ul');

  // Get the height of the overall UL for the Mobile view and pass it to the CSS variable

  const divHeight = mainUL.children.length * 46;
  const height = document.querySelector(':root');
  height.style.setProperty('--height', `${divHeight}px`);
  height.style.setProperty('--original-height', `${divHeight}px`);
  multilevelAccordion(mainUL);
  mainUL.querySelectorAll('details').forEach((details) => {
    details.addEventListener('toggle', (event) => {
      if (event.target.open) {
        height.style.setProperty('--height', 'auto');
        const value = findLevel(event.target);
        event.target.querySelector('ul').querySelectorAll(':scope > details').forEach((ele) => {
          ele.querySelector('summary').classList.add(`itemcolor${value + 1}`);
        });
        details.parentElement.querySelectorAll('details').forEach((ele) => {
          if (ele !== event.target) {
            ele.removeAttribute('open');
          }
        });
      }
    });
  });
  mainUL.querySelectorAll('details').forEach((el) => {
    const detailObject = new Accordion(el);
    tracker.push(detailObject);
  });
  tracker.forEach((t) => {
    t.el.addEventListener('click', () => {
      tracker.forEach((t2) => {
        if (t2 !== t && !t.parent.isEqualNode(t2.el)) {
          t2.shrink();
        }
      });
    });
  });
}
