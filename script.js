// PapaParseのCDNはhtmlで読み込んでください。
// 例: <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>

async function loadCSV(url) {
  const res = await fetch(url);
  const csvText = await res.text();

  const parsed = Papa.parse(csvText, {
    header: true,       // 1行目をヘッダーとして扱う
    skipEmptyLines: true,
  });

  return parsed.data;
}

function renderTable(data) {
  const tbody = document.querySelector('#gamesTable tbody');
  tbody.innerHTML = '';

  data.forEach(game => {
    if (!game.title) return;  // 空行やタイトルなしはスキップ

    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${game.title}</td>
      <td style="text-align:right;">${game.review_count}</td>
      <td>${game.review_summary}</td>
      <td>${game.tags}</td>
      <td><img src="${game.image_url}" alt="${game.title}" /></td>
      <td><a href="${game.store_url}" target="_blank" rel="noopener noreferrer">Steam</a></td>
    `;

    tbody.appendChild(tr);
  });
}

async function main() {
  const data = await loadCSV('steam_reviews.csv');
  renderTable(data);

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    const filtered = data.filter(game => game.title.toLowerCase().includes(q));
    renderTable(filtered);
  });
}

main();
