// frontend.js
async function loadData() {
  const loading = document.getElementById("loading");
  const dataContainer = document.getElementById("data-container");
  loading.style.display = "block";
  dataContainer.style.display = "none";
  try {
    // Fetch live data from API only - no cached data
    const response = await fetch("/api/properties");
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    renderTable(data.properties);
    updateTotal(data.total);
    updateLastUpdated(data.timestamp);
    loading.style.display = "none";
    dataContainer.style.display = "block";
  } catch (error) {
    console.error("Error loading data:", error);
    loading.innerHTML = '<p style="color: red;">Error loading live data. Please refresh the page.</p>';
  }
}
function renderTable(properties) {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = "";
  properties.forEach((prop) => {
    const row = document.createElement("tr");
    const priceDisplay = prop.currentPrice > 0 ? `<span class="price">${formatPrice(prop.currentPrice)} €</span>` : `<span class="no-bids">No bids (0 €)</span>`;
    const statusClass = prop.status.includes("Ended") ? "status-ended" : "status-active";

    // Format time left - if status says "Ended", always show expired
    let timeLeftDisplay = "";
    if (prop.status.includes("Ended")) {
      timeLeftDisplay = '<span class="time-expired">Expired</span>';
    } else if (prop.auctionEnd) {
      // For active auctions, recalculate from auctionEnd to get current time
      const endDate = new Date(prop.auctionEnd);
      const now = new Date();
      const msLeft = endDate.getTime() - now.getTime();
      const minutesLeft = Math.round(msLeft / (1000 * 60));

      if (minutesLeft < 0) {
        timeLeftDisplay = '<span class="time-expired">Expired</span>';
      } else if (minutesLeft === 0) {
        timeLeftDisplay = '<span class="time-ending">Ending now</span>';
      } else if (minutesLeft < 60) {
        timeLeftDisplay = `<span class="time-active">${minutesLeft} min</span>`;
      } else if (minutesLeft < 1440) {
        const hours = Math.floor(minutesLeft / 60);
        const mins = minutesLeft % 60;
        timeLeftDisplay = `<span class="time-active">${hours}h ${mins}m</span>`;
      } else {
        const days = Math.floor(minutesLeft / 1440);
        const hours = Math.floor((minutesLeft % 1440) / 60);
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
function updateTotal(total) {
  const totalElement = document.getElementById("total-amount");
  totalElement.textContent = `${formatPrice(total)} €`;
}
function formatPrice(price) {
  return new Intl.NumberFormat("fi-FI").format(price);
}
function updateLastUpdated(timestamp) {
  const lastUpdated = document.getElementById("last-updated");
  if (timestamp) {
    lastUpdated.textContent = `Last updated: ${timestamp}`;
  } else {
    const now = new Date;
    lastUpdated.textContent = `Last updated: ${now.toLocaleString("fi-FI")}`;
  }
}
window.loadData = loadData;
loadData();
