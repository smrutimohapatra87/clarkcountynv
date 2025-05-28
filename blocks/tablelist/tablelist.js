/*
 * Table Block
 * Recreate a table with row count selector
 * https://www.hlx.live/developer/block-collection/table
 */

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

function getMaxColumns(block) {
  let maxColumns = 0;
  [...block.children].forEach((row) => {
    const columnCount = [...row.children].length;
    maxColumns = Math.max(maxColumns, columnCount);
  });
  return maxColumns;
}

export default async function decorate(block) {
  // Gather all rows from the block
  const allRows = [...block.children];

  // Remove all original rows from the block
  allRows.forEach((row) => block.removeChild(row));
  const header = !block.classList.contains('no-header');
  const maxColumns = getMaxColumns(block);

  // Create filter control
  const filterDiv = document.createElement('div');
  filterDiv.className = 'table-row-filter';
  filterDiv.innerHTML = `
    <label for="row-selector">Rows per page:</label>
    <select id="row-selector">
      <option value="5">5</option>
      <option value="10" selected>10</option>
      <option value="20">20</option>
    </select>
  `;

  // Create a container for the table
  let tableContainer = block.querySelector('.table-container');
  if (!tableContainer) {
    tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    block.appendChild(tableContainer);
  }

  // Render table with given number of rows
  function renderTable(rowCount) {
    tableContainer.innerHTML = '';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    if (header) table.append(thead);
    table.append(tbody);

    const rowsToShow = header ? allRows.slice(0, 1 + rowCount) : allRows.slice(0, rowCount);

    rowsToShow.forEach((child, i) => {
      // Skip filter and container nodes
      if (child.classList && (child.classList.contains('table-row-filter') || child.classList.contains('table-container'))) return;

      const row = document.createElement('tr');
      if (header && i === 0) thead.append(row);
      else tbody.append(row);

      const childColumns = [...child.children];

      if (maxColumns === 2 && childColumns.length === 1) {
        const cell = buildCell(header ? i : i + 1);
        cell.innerHTML = childColumns[0].innerHTML;
        cell.setAttribute('colspan', '2');
        row.append(cell);
      } else if (childColumns.length === 1 && block.classList.contains('mixed-columns')) {
        const cell = buildCell(header ? i : i + 1);
        cell.innerHTML = childColumns[0].innerHTML;
        cell.setAttribute('colspan', maxColumns);
        row.append(cell);
      } else {
        childColumns.forEach((col) => {
          const cell = buildCell(header ? i : i + 1);
          cell.innerHTML = col.innerHTML;
          row.append(cell);
        });
      }
    });

    // Fix for extra space after underline
    table.querySelectorAll('u').forEach((el) => {
      const next = el.nextSibling;
      if (next && next.nodeName === '#text') {
        next.textContent = next.textContent.replace(/^ +/, '');
      }
    });

    tableContainer.append(table);
  }

  // Insert filter control at the top of the block
  block.insertBefore(filterDiv, block.firstChild);

  // Initial render
  renderTable(10);

  // Listen for row count changes
  filterDiv.querySelector('#row-selector').addEventListener('change', (e) => {
    renderTable(Number(e.target.value));
  });
}
