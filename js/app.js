// ================= НАСТРОЙКИ =================
const STORAGE_KEY = "tomato_list";

// ❗ ОБЯЗАТЕЛЬНО ЗАМЕНИ НА СВОИ
const AIRTABLE_BASE_ID = "PASTE_BASE_ID_HERE";
const AIRTABLE_TABLE = "Tomatoes";
const AIRTABLE_TOKEN = "PASTE_TOKEN_HERE";

// ================= ХРАНЕНИЕ =================
function getList() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ================= ДАННЫЕ =================
let tomatoes = [];

// ================= ЗАГРУЗКА ИЗ AIRTABLE =================
async function loadTomatoes() {
  try {
    const url =
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}` +
      `?filterByFormula=${encodeURIComponent("Visible = TRUE()")}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      }
    });

    if (!res.ok) {
      throw new Error("Airtable error: " + res.status);
    }

    const data = await res.json();

    if (!data.records) {
      throw new Error("No records in response");
    }

    tomatoes = data.records.map(r => ({
      id: r.id,
      name: r.fields.Name || "Без названия"
    }));

    renderCatalog();
    updateCounters();

  } catch (err) {
    console.error("LOAD ERROR:", err);
    document.getElementById("catalog").innerHTML =
      "<div class='text-red-600'>Ошибка загрузки каталога</div>";
  }
}

// ================= РЕНДЕР КАТАЛОГА =================
const catalog = document.getElementById("catalog");

function renderCatalog() {
  const list = getList();
  catalog.innerHTML = "";

  tomatoes.forEach(t => {
    const inList = list.includes(t.id);

    const card = document.createElement("div");
    card.className = "border rounded p-4 bg-white";

    card.innerHTML = `
      <h3 class="font-semibold mb-2">${t.name}</h3>
      <button
        class="addBtn ${inList ? "bg-gray-300" : "bg-green-600 text-white"} px-3 py-1 rounded"
        data-id="${t.id}"
        ${inList ? "disabled" : ""}
      >
        ${inList ? "✓ В списке" : "+ В список"}
      </button>
    `;

    catalog.appendChild(card);
  });
}

// ================= СЧЁТЧИК =================
function updateCounters() {
  const count = getList().length;
  document.getElementById("listCount").textContent = count;
  document.getElementById("modalCount").textContent = count;
}

// ================= ДОБАВЛЕНИЕ =================
document.addEventListener("click", e => {
  if (e.target.classList.contains("addBtn")) {
    const id = e.target.dataset.id;
    const list = getList();
    if (!list.includes(id)) {
      list.push(id);
      saveList(list);
      renderCatalog();
      updateCounters();
    }
  }
});

// ================= МОДАЛКА =================
const modal = document.getElementById("listModal");
const listItems = document.getElementById("listItems");

document.getElementById("openList").onclick = () => {
  renderList();
  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

document.getElementById("closeList").onclick = () => {
  modal.classList.add("hidden");
};

function renderList() {
  const list = getList();
  listItems.innerHTML = "";

  if (list.length === 0) {
    listItems.innerHTML = "<li class='text-gray-500'>Список пуст</li>";
    return;
  }

  list.forEach((id, index) => {
    const tomato = tomatoes.find(t => t.id === id);
    if (!tomato) return;

    const li = document.createElement("li");
    li.className = "flex justify-between items-center border-b pb-1";

    li.innerHTML = `
      <span>${index + 1}. ${tomato.name}</span>
      <button data-id="${id}" class="removeBtn text-red-600 text-sm">удалить</button>
    `;

    listItems.appendChild(li);
  });
}

// ================= УДАЛЕНИЕ =================
document.addEventListener("click", e => {
  if (e.target.classList.contains("removeBtn")) {
    const id = e.target.dataset.id;
    let list = getList();
    list = list.filter(x => x !== id);
    saveList(list);
    renderList();
    renderCatalog();
    updateCounters();
  }
});

// ================= ОЧИСТКА =================
document.getElementById("clearList").onclick = () => {
  saveList([]);
  renderList();
  renderCatalog();
  updateCounters();
};

// ================= ОТПРАВКА (ПОКА ЗАГЛУШКА) =================
document.getElementById("sendList").onclick = () => {
  alert("Форма отправки будет следующим шагом");
};

// ================= INIT =================
loadTomatoes();
