function createTagElement(tags) {
  if (!tags) return '';
  const tagArr = tags.split(',').map(t => t.trim()).filter(t => t);
  if (tagArr.length <= 4) {
    return tagArr.map(t => `<span class="tag">${t}</span>`).join('');
  }

  const visibleTags = tagArr.slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('');
  const hiddenTags = tagArr.slice(4).map(t => `<span class="tag">${t}</span>`).join('');

  return `
    <div class="tag-container">
      ${visibleTags}<span class="ellipsis">... </span>
      <span class="hidden-tags" style="display:none;">${hiddenTags}</span>
      <a href="#" class="toggle-tags">タグを全表示</a>
    </div>
  `;
}

function fillTableBody(data) {
  const tbody = document.querySelector('#gamesTable tbody');
  tbody.innerHTML = '';

  data.forEach(game => {
    if (!game.title) return;

    const tr = document.createElement('tr');

    // 画像タグを作成（最初は表示）
    const imgHtml = game.image_url
      ? `<img src="${game.image_url}" alt="${game.title}" class="game-img" />`
      : '';

    tr.innerHTML = `
      <td>
        <a href="${game.store_url}" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; gap:8px;">
          ${imgHtml}
          <span class="title-text">${game.title}</span>
        </a>
      </td>
      <td style="text-align:right;">${game.review_count}</td>
      <td data-order="${reviewRank[game.review_summary] ?? 99}">
        ${game.review_summary}
      </td>
      <td>${createTagElement(game.tags)}</td>
    `;

    tbody.appendChild(tr);

    // 画像の読み込みエラー時に非表示にする処理をここで追加
    const img = tr.querySelector('img.game-img');
    if (img) {
      img.onerror = () => {
        img.style.display = 'none';  // 画像が壊れていたら非表示にする
      };
    }
  });
}

function initTagToggle() {
  $('#gamesTable').off('click', '.toggle-tags').on('click', '.toggle-tags', function (e) {
    e.preventDefault();
    const $container = $(this).closest('.tag-container');
    const $hiddenTags = $container.find('.hidden-tags');
    const $ellipsis = $container.find('.ellipsis');

    if ($hiddenTags.is(':visible')) {
      $hiddenTags.hide();
      $ellipsis.show();
      $(this).text('タグを全表示');
    } else {
      $hiddenTags.show();
      $ellipsis.hide();
      $(this).text('閉じる');
    }
  });
}

async function loadData(name, url) {
  const res = await fetch(name);
  const encryptedBase64 = await res.text();

  const rawData = CryptoJS.enc.Base64.parse(encryptedBase64);
  const iv = CryptoJS.lib.WordArray.create(rawData.words.slice(0, 4));
  const cipherText = CryptoJS.lib.WordArray.create(rawData.words.slice(4), rawData.sigBytes - 16);
  const key = CryptoJS.SHA256(url);
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: cipherText },
    key,
    { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );
  const rowData = decrypted.toString(CryptoJS.enc.Utf8);

  return rowData;
}

const reviewRank = {
  '圧倒的に好評': 1,
  '非常に好評': 2,
  '好評': 3,
  'やや好評': 4,
  '賛否両論': 5,
  'やや不評': 6,
  '不評': 7,
  '非常に不評': 8,
};

function deduplicateGames(data) {
  const map = new Map();

  data.forEach(game => {
    if (!game.store_url) return;

    // すでにあればスキップ、なければ追加
    if (!map.has(game.store_url)) {
      map.set(game.store_url, game);
    }
  });

  return Array.from(map.values());
}

async function main() {
  const rowData = await loadData("steam_reviews", "https://tsumige-finder.github.io/steam_reviews");
  const results = Papa.parse(rowData, {
    header: true,
    skipEmptyLines: true,
  });

  const uniqueData = deduplicateGames(results.data);
  fillTableBody(uniqueData);

  const table = $('#gamesTable').DataTable({
    pageLength: -1,
    lengthMenu: [[-1], ['すべて表示']],
    language: {
      url: '//cdn.datatables.net/plug-ins/2.3.6/i18n/ja.json',
    },
    order: [],
    columnDefs: [
      {
        targets: 1, // レビュー数
        orderSequence: ['desc', 'asc', '']
      },
      {
        targets: 2, // 評価列
        orderable: true
      }
    ],
    initComplete: function () {
      const api = this.api();

      // 2 行目（フィルタ行）の input にイベントを付与
      api.columns().every(function () {
        const column = this;
        $('input', column.header()).on('keyup change clear', function () {
          if (column.search() !== this.value) {
            column.search(this.value).draw();
          }
        });
      });
    }
  });

  initTagToggle();
}

main();