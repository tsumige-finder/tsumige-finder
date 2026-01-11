// CSVパース用ライブラリなしで最低限の処理。カンマはタイトルに入らない前提。
// steam_reviews.csv はUTF-8 BOMなしでアップロードしてください。

async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  return text.split('\n').map(line => line.trim()).filter(line => line).map(line => {
    // "title","appid",...のヘッダーと区切りを処理
    // ただし簡易的な処理なので、CSV内にカンマがある場合は要改良
    const parts = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"').replace(/,$/, ''));
    return {
      title: parts[0],
      appid: parts[1],
      release_date: parts[2],
      review_summary: parts[3],
      review_count: parts[4],
      tags: parts[5],
      image_url: parts[6],
      store_url: parts[7],
      status: parts[8]
    };
  });
}

function renderTable(data) {
  const tbody = document.querySelector('#gamesTable tbody');
  tbody.innerHTML = '';
  data.forEach(game => {
    if (game.title === "title") return; // ヘッダー行はスキップ

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
