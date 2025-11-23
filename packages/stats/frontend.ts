interface PropertyData {
  id: string;
  propertyNumber: string;
  url: string;
  currentPrice: number;
  hasBids: boolean;
  status: string;
  auctionEnd?: string;
  minutesLeft?: number;
}

async function loadData() {
  const loading = document.getElementById('loading')!;
  const dataContainer = document.getElementById('data-container')!;

  loading.style.display = 'block';
  dataContainer.style.display = 'none';

  try {
    const response = await fetch('/api/properties');
    const data = await response.json();

    renderTable(data.properties);
    updateTotal(data.total);
    updateLastUpdated();

    loading.style.display = 'none';
    dataContainer.style.display = 'block';
  } catch (error) {
    console.error('Error loading data:', error);
    loading.innerHTML = '<p style="color: red;">Error loading data. Please try again.</p>';
  }
}

function renderTable(properties: PropertyData[]) {
  const tbody = document.getElementById('table-body')!;
  tbody.innerHTML = '';

  properties.forEach(prop => {
    const row = document.createElement('tr');

    const priceDisplay = prop.currentPrice > 0
      ? `<span class="price">${formatPrice(prop.currentPrice)} €</span>`
      : `<span class="no-bids">No bids (0 €)</span>`;

    const statusClass = prop.status.includes('Ended') ? 'status-ended' : 'status-active';

    // Format time left
    let timeLeftDisplay = '';
    if (prop.minutesLeft !== undefined) {
      if (prop.minutesLeft < 0) {
        timeLeftDisplay = '<span class="time-expired">Expired</span>';
      } else if (prop.minutesLeft === 0) {
        timeLeftDisplay = '<span class="time-ending">Ending now</span>';
      } else if (prop.minutesLeft < 60) {
        timeLeftDisplay = `<span class="time-active">${prop.minutesLeft} min</span>`;
      } else if (prop.minutesLeft < 1440) { // Less than 24 hours
        const hours = Math.floor(prop.minutesLeft / 60);
        const mins = prop.minutesLeft % 60;
        timeLeftDisplay = `<span class="time-active">${hours}h ${mins}m</span>`;
      } else {
        const days = Math.floor(prop.minutesLeft / 1440);
        const hours = Math.floor((prop.minutesLeft % 1440) / 60);
        timeLeftDisplay = `<span class="time-active">${days}d ${hours}h</span>`;
      }
    }

    row.innerHTML = `
      <td>${prop.propertyNumber}</td>
      <td>#${prop.id}</td>
      <td>${priceDisplay}</td>
      <td>${timeLeftDisplay}</td>
      <td><span class="status-badge ${statusClass}">${prop.status}</span></td>
      <td><a href="${prop.url}" target="_blank" class="property-link">View Auction</a></td>
    `;

    tbody.appendChild(row);
  });
}

function updateTotal(total: number) {
  const totalElement = document.getElementById('total-amount')!;
  totalElement.textContent = `${formatPrice(total)} €`;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fi-FI').format(price);
}

function updateLastUpdated() {
  const lastUpdated = document.getElementById('last-updated')!;
  const now = new Date();
  lastUpdated.textContent = `Last updated: ${now.toLocaleString('fi-FI')}`;
}

// Make loadData available globally
(window as any).loadData = loadData;

// Load data on page load
loadData();
