// ================= НАСТРОЙКИ =================
const STORAGE_KEY = "tomato_list_v2"; // Обновил ключ, чтобы сбросить старый формат
const ORDER_HISTORY_KEY = "last_order_v2";
const AIRTABLE_BASE_ID = "app6EHiUQjTfVJlms";
const AIRTABLE_TABLE = "Varieties";

// ⚠️ ВСТАВЬТЕ СЮДА ВАШ ТОКЕН
const AIRTABLE_TOKEN = "pat0R02hyAk7fJhlD.ab90f622e65eeeb214d86e2693d6438633744c09a621e10a70fc2eea19359891"; 

// ================= ХРАНЕНИЕ =================
const getList = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
const saveList = (l) => localStorage.setItem(STORAGE_KEY, JSON.stringify(l));

const getOrder = () => JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY));
const saveOrder = (o) => localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(o));
const clearOrder = () => localStorage.removeItem(ORDER_HISTORY_KEY);

// ================= ДАННЫЕ =================
let tomatoes = [];
let filteredTomatoes = [];

// ================= ЗАГРУЗКА ТОМАТОВ =================
async function loadTomatoes() {
  const catalogEl = document.getElementById("catalog");
  
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    if (!res.ok) throw new Error("Ошибка доступа к API");

    const data = await res.json();

    tomatoes = data.records
      .filter((r) => r.fields?.Name && r.fields.visible === true)
      .map((r) => ({
        id: r.id,
        name: r.fields.Name,
        description: r.fields.description || "",
        color: r.fields.color || "Разное",
        fruit_type: r.fields.fruit_type || "Классика",
        growth_type: r.fields.growth_type || "Индет",
        image: r.fields.image_url || "https://placehold.co/400x300?text=Нет+фото" // Заглушка
      }));

    filteredTomatoes = [...tomatoes];
    renderCatalog();
    updateCounters();
    checkActiveOrder(); // Проверяем, есть ли активный заказ

  } catch (err) {
    console.error(err);
    catalogEl.innerHTML = `
      <div class='col-span-full text-center p-10'>
        <div class="text-red-600 text-xl font-bold mb-2">Ошибка загрузки</div>
        <p class="text-gray-500">Проверьте подключение к интернету или API токен.</p>
      </div>`;
  }
}

// ================= ФИЛЬТРЫ =================
const searchInput = document.getElementById("searchInput");
const filterColor = document.getElementById("filterColor");
const filterType = document.getElementById("filterType");
const filterGrowth = document.getElementById("filterGrowth");
const resetFilters = document.getElementById("resetFilters");

function applyFilters() {
  const q = searchInput.value.toLowerCase().trim();
  const c = filterColor.value;
  const t = filterType.value;
  const g = filterGrowth.value;

  filteredTomatoes = tomatoes.filter((tomato) => {
    const matchesSearch = !q || tomato.name.toLowerCase().includes(q);
    const matchesColor = !c || tomato.color === c;
    const matchesType = !t || tomato.fruit_type === t;
    const matchesGrowth = !g || tomato.growth_type === g;
    return matchesSearch && matchesColor && matchesType && matchesGrowth;
  });

  renderCatalog();
}

[searchInput, filterColor, filterType, filterGrowth].forEach(el => 
  el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', applyFilters)
);

resetFilters.onclick = () => {
  searchInput.value = "";
  filterColor.value = "";
  filterType.value = "";
  filterGrowth.value = "";
  applyFilters();
};

// ================= КАТАЛОГ (RENDER) =================
const catalog = document.getElementById("catalog");

function renderCatalog() {
  const list = getList();
  catalog.innerHTML = "";

  if (filteredTomatoes.length === 0) {
    catalog.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10">Ничего не найдено 🍅</div>`;
    return;
  }

  filteredTomatoes.forEach((t) => {
    const inList = list.includes(t.id);
    // Определяем цвет тега в зависимости от цвета томата (для красоты)
    let badgeColor = "bg-gray-100 text-gray-800";
    if (t.color === "Red") badgeColor = "bg-red-100 text-red-800";
    if (t.color === "Green") badgeColor = "bg-green-100 text-green-800";
    if (t.color === "Yellow") badgeColor = "bg-yellow-100 text-yellow-800";

    catalog.innerHTML += `
      <div class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full tomato-card" data-id="${t.id}">
        <div class="relative overflow-hidden aspect-[4/3] cursor-pointer">
           <img src="${t.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
           ${inList ? '<div class="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow">В списке</div>' : ''}
        </div>
        
        <div class="p-4 flex flex-col flex-grow">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs px-2 py-0.5 rounded ${badgeColor}">${t.color}</span>
            <span class="text-xs text-gray-400">${t.fruit_type}</span>
          </div>
          
          <h3 class="font-bold text-lg mb-1 leading-tight text-gray-800">${t.name}</h3>
          
          <div class="mt-auto pt-4 flex gap-2">
            <button class="detailBtn flex-1 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition" data-id="${t.id}">
              Подробнее
            </button>
            <button class="addBtn flex-1 px-3 py-2 rounded-lg text-sm font-medium transition shadow-sm
              ${inList ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100" : "bg-green-600 text-white hover:bg-green-700"}"
              data-id="${t.id}">
              ${inList ? "Убрать" : "В список"}
            </button>
          </div>
        </div>
      </div>`;
  });
}

// ================= МОДАЛКА ДЕТАЛЕЙ =================
const detailModal = document.getElementById("detailModal");
const detailContent = document.getElementById("detailContent");
const closeDetail = document.getElementById("closeDetail");

function openDetailModal(t) {
  detailContent.innerHTML = `
    <div class="grid md:grid-cols-2 gap-0 md:gap-6 bg-white">
      <div class="h-64 md:h-auto bg-gray-100">
        <img src="${t.image}" class="w-full h-full object-cover">
      </div>
      <div class="p-6 overflow-y-auto">
        <h2 class="text-2xl font-bold mb-2">${t.name}</h2>
        <div class="flex flex-wrap gap-2 mb-4 text-sm">
           <span class="bg-gray-100 px-2 py-1 rounded">Тип: ${t.fruit_type}</span>
           <span class="bg-gray-100 px-2 py-1 rounded">Цвет: ${t.color}</span>
           <span class="bg-gray-100 px-2 py-1 rounded">Рост: ${t.growth_type}</span>
        </div>
        <p class="text-gray-700 leading-relaxed whitespace-pre-line">${t.description || "Описание готовится..."}</p>
      </div>
    </div>
  `;
  detailModal.classList.remove("hidden");
  detailModal.classList.add("flex");
  document.body.style.overflow = "hidden"; // Блок прокрутки фона
}

closeDetail.onclick = () => {
  detailModal.classList.add("hidden");
  document.body.style.overflow = "";
};

detailModal.onclick = (e) => {
  if (e.target === detailModal) closeDetail.click();
};

// ================= КЛИКИ (ДЕЛЕГИРОВАНИЕ) =================
document.addEventListener("click", (e) => {
  // Клик по картинке карточки
  const imgContainer = e.target.closest(".tomato-card .relative");
  if (imgContainer) {
    const id = e.target.closest(".tomato-card").dataset.id;
    openDetailModal(tomatoes.find(x => x.id === id));
    return;
  }

  // Кнопка подробнее
  if (e.target.classList.contains("detailBtn")) {
    const id = e.target.dataset.id;
    openDetailModal(tomatoes.find(x => x.id === id));
    return;
  }

  // Кнопка В список / Убрать
  if (e.target.classList.contains("addBtn")) {
    e.stopPropagation(); // Чтобы не открылась модалка
    const id = e.target.dataset.id;
    const currentList = getList();
    
    if (currentList.includes(id)) {
      saveList(currentList.filter(x => x !== id)); // Убрать
    } else {
      saveList([...currentList, id]); // Добавить
    }
    
    renderCatalog(); 
    updateCounters();
    // Если открыта модалка списка, перерисуем и её
    if (!document.getElementById("listModal").classList.contains("hidden")) {
      renderListModal();
    }
  }

  // Удалить из модалки списка
  if (e.target.classList.contains("removeBtn")) {
    const id = e.target.dataset.id;
    saveList(getList().filter(x => x !== id));
    renderListModal();
    renderCatalog();
    updateCounters();
  }
});

// ================= МОДАЛКА СПИСКА =================
const listModal = document.getElementById("listModal");
const listItems = document.getElementById("listItems");
const orderFormBlock = document.getElementById("orderFormBlock");

// Открытие
document.getElementById("openList").onclick = () => {
  renderListModal();
  listModal.classList.remove("hidden");
  listModal.classList.add("flex");
  document.body.style.overflow = "hidden";
};

// Закрытие
document.getElementById("closeList").onclick = () => {
  listModal.classList.add("hidden");
  document.body.style.overflow = "";
};

function renderListModal() {
  const list = getList();
  
  // Если список пуст
  if (list.length === 0) {
    listItems.innerHTML = `<li class="text-center text-gray-500 py-4">Ваш список пока пуст.</li>`;
    // Блокируем кнопку отправки
    document.getElementById("sendList").disabled = true;
    document.getElementById("sendList").classList.add("opacity-50", "cursor-not-allowed");
    return;
  }

  // Разблокируем кнопку
  document.getElementById("sendList").disabled = false;
  document.getElementById("sendList").classList.remove("opacity-50", "cursor-not-allowed");

  listItems.innerHTML = list.map((id, index) => {
    const t = tomatoes.find(x => x.id === id);
    if (!t) return "";
    return `
      <li class="flex justify-between items-center bg-white p-3 rounded border shadow-sm">
        <div class="flex items-center gap-3">
          <span class="font-bold text-green-600 text-sm w-5">${index + 1}.</span>
          <img src="${t.image}" class="w-10 h-10 object-cover rounded bg-gray-100">
          <span class="font-medium text-sm sm:text-base">${t.name}</span>
        </div>
        <button data-id="${id}" class="removeBtn text-red-500 hover:text-red-700 p-1 text-xl leading-none">
          &times;
        </button>
      </li>`;
  }).join("");
}

document.getElementById("clearList").onclick = () => {
  if (confirm("Точно очистить весь список?")) {
    saveList([]);
    renderListModal();
    renderCatalog();
    updateCounters();
  }
};

// ================= ОТПРАВКА ЗАКАЗА =================
document.getElementById("sendList").onclick = () => {
  const name = document.getElementById("orderName").value.trim();
  const phone = document.getElementById("orderPhone").value.trim();
  const address = document.getElementById("orderAddress").value.trim();
  const comment = document.getElementById("orderComment").value.trim();
  
  if (!name || !phone) {
    alert("❗ Пожалуйста, укажите Имя и Телефон для связи.");
    return;
  }

  const list = getList();
  const varieties = list.map(id => tomatoes.find(t => t.id === id)?.name).filter(Boolean);
  
  // Собираем объект заказа
  const newOrder = {
    id: Date.now(),
    date: new Date().toLocaleString("ru-RU"),
    client: { name, phone, address, comment },
    items: varieties,
    status: "created"
  };

  // 1. Сохраняем в историю (localStorage)
  saveOrder(newOrder);

  // 2. Очищаем корзину и форму
  saveList([]);
  document.getElementById("orderName").value = "";
  document.getElementById("orderPhone").value = "";
  document.getElementById("orderAddress").value = "";
  document.getElementById("orderComment").value = "";

  // 3. UI Обновления
  updateCounters();
  renderCatalog();
  listModal.classList.add("hidden");
  document.body.style.overflow = "";

  // 4. Показываем красивое подтверждение
  showOrderSuccess(newOrder);
};

function showOrderSuccess(order) {
  // Создаем текст для WhatsApp
  const text = `Здравствуйте! Меня зовут ${order.client.name}. \nХочу заказать сорта:\n- ${order.items.join("\n- ")}\n\nТелефон: ${order.client.phone}\nАдрес: ${order.client.address || "Не указан"}\nКомментарий: ${order.client.comment || "-"}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

  const banner = document.createElement("div");
  banner.id = "successBanner";
  banner.className = "fixed bottom-5 right-5 left-5 md:left-auto max-w-md bg-white border-l-4 border-green-500 shadow-2xl rounded p-4 z-[60] flex flex-col gap-3 animate-bounce-in";
  
  banner.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <h3 class="font-bold text-green-700">✅ Заявка сохранена!</h3>
        <p class="text-sm text-gray-600 mt-1">Мы сохранили ваш список.</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400">&times;</button>
    </div>
    <div class="bg-gray-50 p-2 text-xs rounded text-gray-700">
      ${order.items.length} сортов на имя ${order.client.name}
    </div>
    <div class="flex gap-2">
       <a href="${whatsappUrl}" target="_blank" class="flex-1 bg-green-500 text-white text-center py-2 rounded text-sm hover:bg-green-600">
         📲 Отправить в WhatsApp
       </a>
       <button id="closeSuccess" class="px-3 py-2 border rounded text-sm hover:bg-gray-100">Закрыть</button>
    </div>
  `;

  document.body.appendChild(banner);
  document.getElementById("closeSuccess").onclick = () => banner.remove();
  
  // Удаляем баннер через 10 секунд
  setTimeout(() => banner && banner.remove(), 15000);
  
  // Обновляем плашку текущего заказа
  checkActiveOrder();
}

// ================= БАННЕР АКТИВНОГО ЗАКАЗА =================
function checkActiveOrder() {
  const order = getOrder();
  const existingBanner = document.getElementById("stickyOrderBanner");
  
  if (!order) {
    if (existingBanner) existingBanner.remove();
    return;
  }

  if (!existingBanner) {
    const banner = document.createElement("div");
    banner.id = "stickyOrderBanner";
    banner.className = "bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm px-4 py-2 flex justify-between items-center";
    banner.innerHTML = `
      <span>📦 Ваш последний заказ от ${order.date.split(',')[0]}</span>
      <button id="viewOrderParams" class="underline font-medium">Посмотреть</button>
    `;
    // Вставляем сразу после шапки
    document.querySelector("header").after(banner);
    
    document.getElementById("viewOrderParams").onclick = () => {
      alert(`Заказ от ${order.date}\n\nСорта:\n${order.items.join(", ")}\n\nСтатус: Ожидает обработки`);
    };
  }
}

// ================= СЧЁТЧИК =================
function updateCounters() {
  const count = getList().length;
  document.getElementById("listCount").textContent = count;
  document.getElementById("modalCount").textContent = count;
}

// ================= INIT =================
loadTomatoes();
