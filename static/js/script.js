let allData = [];
let selectedIds = new Set();
const STORAGE_KEY = "selected_conferences_v1";

window.onload = loadData;

async function loadData() {
    try {
        const res = await fetch("/api/conferences");
        allData = await res.json();

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsedIds = JSON.parse(saved);
            selectedIds = new Set(parsedIds);
        } else {
            allData.forEach((d) => selectedIds.add(d.id));
            saveSelection();
        }

        document.getElementById("loading").style.display = "none";
        document.getElementById("main-content").style.display = "block";

        renderFilters();
        renderCards();
        startTimer();
    } catch (e) {
        console.error(e);
    }
}

async function refreshData() {
    document.getElementById("loading").style.display = "block";
    await fetch("/api/refresh");
    loadData();
}

function saveSelection() {
    const arrayToSave = Array.from(selectedIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arrayToSave));
}

// --- [신규 기능] 그룹 전체 토글 ---
function toggleGroup(sub, isChecked) {
    // 해당 그룹(sub)에 속하는 모든 학회 찾기
    const groupItems = allData.filter(d => (d.sub || 'Etc') === sub);
    
    groupItems.forEach(item => {
        if (isChecked) {
            selectedIds.add(item.id);
        } else {
            selectedIds.delete(item.id);
        }
    });

    saveSelection();
    renderFilters(); // 체크박스 상태 동기화
    renderCards();   // 카드 리스트 갱신
}

// --- Filter Rendering ---
// --- Filter Rendering ---
function renderFilters() {
    const container = document.getElementById("filter-container");
    container.innerHTML = "";

    // 1. 데이터 그룹화
    const grouped = {};
    allData.forEach((d) => {
        const key = d.sub || "Etc";
        if (!grouped[key]) grouped[key] = { name: d.sub_name, items: [] };
        if (!grouped[key].items.find((x) => x.id === d.id))
            grouped[key].items.push(d);
    });

    // [정렬 1] 카테고리(AI, CV, DB...)를 알파벳 순으로 정렬
    const sortedCategories = Object.keys(grouped).sort();

    for (const sub of sortedCategories) {
        const data = grouped[sub];

        // [정렬 2] 카테고리 내부 학회(AAAI, CVPR...)를 알파벳 순으로 정렬
        data.items.sort((a, b) => a.id.localeCompare(b.id));

        // --- UI 생성 (기존 로직 유지) ---
        const groupDiv = document.createElement("div");
        groupDiv.className = "filter-group";

        // 전체 선택 여부 확인
        const allChecked = data.items.every(item => selectedIds.has(item.id));

        groupDiv.innerHTML = `
            <div class="filter-header" style="cursor:pointer;">
                <input type="checkbox" 
                       ${allChecked ? "checked" : ""} 
                       onchange="toggleGroup('${sub}', this.checked)"
                       style="margin-right: 10px; transform: scale(1.3); cursor:pointer;"
                       title="Select All / Deselect All">
                
                <span class="cat-code">${sub}</span>
                <span class="cat-name">${data.name}</span>
            </div>
        `;

        const listDiv = document.createElement("div");
        listDiv.className = "checkbox-list";

        data.items.forEach((c) => {
            const label = document.createElement("label");
            label.className = "checkbox-item"; 

            const activeClass = c.is_active ? "label-active" : "label-inactive";
            const isChecked = selectedIds.has(c.id);

            label.innerHTML = `
                <input type="checkbox" ${isChecked ? "checked" : ""} 
                       value="${c.id}" 
                       onchange="toggle('${c.id}', this.checked)">
                <span class="${activeClass}">${c.id}</span>
            `;
            listDiv.appendChild(label);
        });

        groupDiv.appendChild(listDiv);
        container.appendChild(groupDiv);
    }
}

function toggle(id, checked) {
    if (checked) selectedIds.add(id);
    else selectedIds.delete(id);
    
    saveSelection();
    
    // 개별 선택 시에도 전체 체크박스 상태(모두 선택됨/해제됨)를 반영하기 위해
    // 필터 UI를 다시 그립니다. (깜빡임이 거슬리면 이 줄은 빼도 됩니다)
    renderFilters(); 
    renderCards();
}

// --- Card Rendering (기존 동일) ---
function renderCards() {
    ["urgent", "upcoming", "future"].forEach(
        (id) => (document.getElementById("row-" + id).innerHTML = "")
    );

    const now = new Date();

    allData.forEach((d) => {
        if (!selectedIds.has(d.id)) return;
        if (!d.is_active) return;

        const deadline = new Date(d.deadline);
        const daysLeft = (deadline - now) / (1000 * 60 * 60 * 24);

        if (daysLeft < -1) return;

        const card = document.createElement("div");
        card.className = "conf-card";

        let targetRow = "row-future";
        if (daysLeft <= 30) {
            card.classList.add("border-red");
            targetRow = "row-urgent";
        } else if (daysLeft <= 90) {
            card.classList.add("border-yellow");
            targetRow = "row-upcoming";
        } else {
            card.classList.add("border-green");
        }

        const dateStr = deadline.toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) +
            " " + deadline.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

        card.innerHTML = `
            <div>
                <div class="conf-title">${d.title} ${d.year}</div>
                <div class="conf-desc" title="${d.description}">${d.description}</div>
                <div class="conf-info"><i class="fas fa-map-marker-alt"></i> ${d.place}</div>
                <div class="conf-info"><i class="far fa-calendar-check"></i> ${dateStr}</div>
            </div>
            
            <div class="countdown-box" data-time="${d.deadline}">Calculation...</div>
            
            <div class="category-tag">
                <div style="font-weight:bold; margin-bottom:2px;">
                    [${d.sub}] ${d.sub_name.split("/")[0]}
                </div>
                ${getStarHTML(d.rank)}
            </div>
        `;

        document.getElementById(targetRow).appendChild(card);
    });
}

function startTimer() {
    setInterval(() => {
        const now = new Date().getTime();
        document.querySelectorAll(".countdown-box").forEach((box) => {
            const dead = new Date(box.getAttribute("data-time")).getTime();
            const diff = dead - now;
            if (diff < 0) {
                box.innerText = "DEADLINE PASSED";
                box.style.color = "gray";
            } else {
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                box.innerText = `${d}d ${h}h ${m}m`;
            }
        });
    }, 1000);
}

function getStarHTML(rank) {
    const r = (rank || 'N').toUpperCase();
    let stars = '';
    
    if (r === 'A') stars = '★★★★';
    else if (r === 'B') stars = '★★★☆';
    else if (r === 'C') stars = '★★☆☆';
    else stars = '★☆☆☆'; // CCF-N or others

    return `<span class="star-rating">${stars}</span>`;
}