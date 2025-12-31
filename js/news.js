// ================= НОВОСТИ (ИЗОЛИРОВАННО И БЕЗОПАСНО) =================
(() => {
  const AIRTABLE_BASE_ID = "app6EHiUQjTfVJlms";
  const AIRTABLE_NEWS_TABLE = "Новости";
  const AIRTABLE_TOKEN = "......b90f622e65eeeb214d86e2693d6438633744c09a621e10a70fc2eea19359891";

  const newsList = document.getElementById("newsList");
  if (!newsList) return; // если блока нет — просто выходим

  async function loadNews() {
    try {
      const res = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_NEWS_TABLE)}?sort[0][field]=date&sort[0][direction]=desc`,
        { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
      );

      if (!res.ok) throw new Error("Airtable error");

      const data = await res.json();
      const records = Array.isArray(data.records) ? data.records : [];

      if (!records.length) {
        newsList.innerHTML = `<div class="text-gray-400">Новостей пока нет</div>`;
        return;
      }

      newsList.innerHTML = records.map(r => {
        const text = r.fields?.text || "";
        const date = r.fields?.date || "";
        if (!text) return "";

        return `
          <div class="border-b pb-2">
            ${date ? `<div class="text-xs text-gray-400">${date}</div>` : ""}
            <div>${text}</div>
          </div>
        `;
      }).join("");

    } catch (err) {
      console.warn("NEWS ERROR:", err);
      newsList.innerHTML = `<div class="text-gray-400">Новостей пока нет</div>`;
    }
  }

  // запускаем после загрузки DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadNews);
  } else {
    loadNews();
  }
})();
