(function () {

    let activeTags = new Set();
    let tagCount = {};
    let tableRef;

    // 🔹 外部から呼ばれる入口
    window.initTagFilter = function (games, table) {
        tableRef = table;
        collectTags(games);
        renderTagButtons();
        registerDataTableFilter();
        registerClearButton();
    };

    function collectTags(games) {
        games.forEach(game => {
            if (!game.tags) return;

            game.tags.split(",").forEach(tag => {
                const t = tag.trim();
                tagCount[t] = (tagCount[t] || 0) + 1;
            });
        });
    }

    function renderTagButtons() {
        const container = document.getElementById("tagButtons");
        if (!container) return;

        Object.entries(tagCount)
            .filter(([_, count]) => count >= 10)
            .sort((a, b) => b[1] - a[1])
            .forEach(([tag, count]) => {
                const btn = document.createElement("button");
                btn.className = "tag-btn";
                btn.textContent = `${tag} (${count})`;
                btn.dataset.tag = tag;
                btn.onclick = () => toggleTag(tag);
                container.appendChild(btn);
            });
    }

    // ⭐ 状態だけをトグル
    function toggleTag(tag) {
        if (activeTags.has(tag)) {
            activeTags.delete(tag);
        } else {
            activeTags.add(tag);
        }

        updateTagUI();
        tableRef.draw();
    }

    // ⭐ UIを一括同期
    function updateTagUI() {
        // タグ一覧
        document.querySelectorAll(".tag-btn").forEach(btn => {
            btn.classList.toggle(
                "active",
                activeTags.has(btn.dataset.tag)
            );
        });

        // gametable 内タグ
        document.querySelectorAll(".clickable-tag").forEach(tagEl => {
            tagEl.classList.toggle(
                "active",
                activeTags.has(tagEl.dataset.tag)
            );
        });
    }

    function registerDataTableFilter() {
        $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {

            if (settings.nTable.id !== "gamesTable") return true;
            if (activeTags.size === 0) return true;

            const rowData = tableRef.row(dataIndex).data();
            const tagText = rowData[3] || "";

            return [...activeTags].every(tag => tagText.includes(tag));
        });
    }

    function registerClearButton() {
        const clearBtn = document.getElementById("clearTags");
        if (!clearBtn) return;

        clearBtn.onclick = () => {
            activeTags.clear();
            updateTagUI();
            tableRef.draw();
        };
    }

    // ⭐ gametable クリック用（UI依存なし）
    window.toggleTagByName = function (tag) {
        toggleTag(tag);
    };

})();

/*
  © 2026 Tsumige Finder
  This source code is proprietary.
*/