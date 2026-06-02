const STORAGE_KEY = "long-distance-meeting-records";

const cityPositions = {
  北京: { x: 59, y: 26 },
  上海: { x: 72, y: 55 },
  杭州: { x: 69, y: 59 },
  南京: { x: 67, y: 51 },
  广州: { x: 61, y: 78 },
  深圳: { x: 63, y: 82 },
  成都: { x: 42, y: 58 },
  重庆: { x: 47, y: 63 },
  武汉: { x: 57, y: 57 },
  西安: { x: 48, y: 43 },
  厦门: { x: 68, y: 74 },
  青岛: { x: 68, y: 38 },
  长沙: { x: 56, y: 66 },
  香港: { x: 64, y: 84 }
};

const demoRecords = [
  {
    id: "demo-shanghai",
    city: "上海",
    startDate: "2025-10-02",
    endDate: "2025-10-05",
    stay: "外滩附近的小酒店",
    scene: "第一次国庆见面",
    note: "晚上一起沿着外滩慢慢走，江风很舒服。那天人很多，但还是觉得整个城市都像只剩下我们两个人。",
    photos: [
      "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "demo-hangzhou",
    city: "杭州",
    startDate: "2026-01-18",
    endDate: "2026-01-20",
    stay: "西湖边的民宿",
    scene: "冬天一起看湖",
    note: "早上买了热豆浆和小笼包，坐在湖边等太阳出来。没有安排很多行程，只是一起散步也很开心。",
    photos: [
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "demo-guangzhou",
    city: "广州",
    startDate: "2026-04-04",
    endDate: "2026-04-06",
    stay: "珠江新城附近",
    scene: "清明小长假",
    note: "一起吃了早茶，点了太多东西，最后两个人撑到说不出话。晚上坐地铁回去的时候，她靠着我睡着了。",
    photos: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80"
    ]
  }
];

const config = window.LOVE_MAP_SUPABASE ?? {};
const tableName = config.tableName || "meeting_records";
const photoBucket = config.photoBucket || "meeting-photos";
const cloudEnabled = Boolean(config.url && config.anonKey && window.supabase);
const cloud = cloudEnabled ? window.supabase.createClient(config.url, config.anonKey) : null;

const elements = {
  markerLayer: document.querySelector("#marker-layer"),
  routePath: document.querySelector("#route-path"),
  timeline: document.querySelector("#timeline"),
  photoGrid: document.querySelector("#photo-grid"),
  totalCount: document.querySelector("#total-count"),
  cityCount: document.querySelector("#city-count"),
  detailCity: document.querySelector("#detail-city"),
  detailTime: document.querySelector("#detail-time"),
  detailStay: document.querySelector("#detail-stay"),
  detailScene: document.querySelector("#detail-scene"),
  detailNote: document.querySelector("#detail-note"),
  syncStatus: document.querySelector("#sync-status"),
  openForm: document.querySelector("#open-form"),
  exportRecords: document.querySelector("#export-records"),
  importRecords: document.querySelector("#import-records"),
  importFile: document.querySelector("#import-file"),
  closeForm: document.querySelector("#close-form"),
  cancelForm: document.querySelector("#cancel-form"),
  resetDemo: document.querySelector("#reset-demo"),
  dialog: document.querySelector("#record-dialog"),
  form: document.querySelector("#record-form")
};

let records = [];
let activeId = null;

init();

async function init() {
  setStatus(cloudEnabled ? "正在连接云端..." : "本地模式：填写 config.js 后开启云端同步");

  if (cloudEnabled) {
    await loadCloudRecords();
    subscribeToCloudChanges();
  } else {
    records = loadLocalRecords();
    activeId = records[0]?.id ?? null;
    render();
  }
}

function loadLocalRecords() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return demoRecords;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : demoRecords;
  } catch {
    return demoRecords;
  }
}

function saveLocalRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

async function loadCloudRecords() {
  const { data, error } = await cloud.from(tableName).select("*").order("start_date", {
    ascending: true
  });

  if (error) {
    records = loadLocalRecords();
    activeId = records[0]?.id ?? null;
    setStatus("云端连接失败，暂时显示本地记录");
    render();
    return;
  }

  records = data.map(fromCloudRecord);
  activeId = records[0]?.id ?? null;
  setStatus(records.length > 0 ? "云端同步已开启" : "云端同步已开启，还没有记录");
  render();
}

function subscribeToCloudChanges() {
  cloud
    .channel("meeting-records")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: tableName },
      () => loadCloudRecords()
    )
    .subscribe();
}

function fromCloudRecord(record) {
  return {
    id: record.id,
    city: record.city,
    startDate: record.start_date,
    endDate: record.end_date ?? "",
    stay: record.stay,
    scene: record.scene,
    note: record.note,
    photos: record.photos ?? []
  };
}

function toCloudRecord(record) {
  return {
    id: record.id,
    city: record.city,
    start_date: record.startDate,
    end_date: record.endDate || null,
    stay: record.stay,
    scene: record.scene,
    note: record.note,
    photos: record.photos
  };
}

function setStatus(text) {
  elements.syncStatus.textContent = text;
}

function formatDateRange(record) {
  const start = formatDate(record.startDate);
  const end = record.endDate ? formatDate(record.endDate) : "";
  return end && end !== start ? `${start} - ${end}` : start;
}

function formatDate(dateText) {
  if (!dateText) {
    return "-";
  }

  const date = new Date(`${dateText}T00:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function getPosition(record) {
  if (cityPositions[record.city]) {
    return cityPositions[record.city];
  }

  let total = 0;
  for (const char of record.city) {
    total += char.charCodeAt(0);
  }

  return {
    x: 22 + (total % 56),
    y: 24 + ((total * 7) % 58)
  };
}

function sortedRecords() {
  return [...records].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

function render() {
  const ordered = sortedRecords();
  elements.totalCount.textContent = records.length;
  elements.cityCount.textContent = new Set(records.map((record) => record.city)).size;

  renderMarkers(ordered);
  renderRoute(ordered);
  renderTimeline(ordered);
  renderDetail(records.find((record) => record.id === activeId) ?? ordered[0]);
}

function renderMarkers(ordered) {
  elements.markerLayer.innerHTML = "";

  ordered.forEach((record, index) => {
    const position = getPosition(record);
    const button = document.createElement("button");
    button.className = `map-marker${record.id === activeId ? " active" : ""}`;
    button.style.left = `${position.x}%`;
    button.style.top = `${position.y}%`;
    button.dataset.city = record.city;
    button.type = "button";
    button.ariaLabel = `查看${record.city}的见面记录`;
    button.textContent = index + 1;
    button.addEventListener("click", () => selectRecord(record.id));
    elements.markerLayer.append(button);
  });
}

function renderRoute(ordered) {
  const points = ordered.map(getPosition);
  elements.routePath.setAttribute(
    "d",
    points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
  );
}

function renderTimeline(ordered) {
  elements.timeline.innerHTML = "";

  ordered.forEach((record) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = record.id === activeId ? "active" : "";
    button.type = "button";
    button.innerHTML = `<strong>${record.city} · ${record.scene}</strong><span>${formatDateRange(record)}</span>`;
    button.addEventListener("click", () => selectRecord(record.id));
    item.append(button);
    elements.timeline.append(item);
  });
}

function renderDetail(record) {
  if (!record) {
    elements.detailCity.textContent = "还没有记录";
    elements.detailTime.textContent = "-";
    elements.detailStay.textContent = "-";
    elements.detailScene.textContent = "-";
    elements.detailNote.textContent = "点击“新增记录”，把你们下一次见面写进地图。";
    elements.photoGrid.innerHTML = "";
    return;
  }

  activeId = record.id;
  elements.detailCity.textContent = record.city;
  elements.detailTime.textContent = formatDateRange(record);
  elements.detailStay.textContent = record.stay;
  elements.detailScene.textContent = record.scene;
  elements.detailNote.textContent = record.note;
  elements.photoGrid.innerHTML = "";

  if (record.photos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "memory-note";
    empty.textContent = "这次还没有上传照片。";
    elements.photoGrid.append(empty);
    return;
  }

  record.photos.forEach((photo, index) => {
    const wrapper = document.createElement("div");
    const image = document.createElement("img");
    wrapper.className = "photo";
    image.src = photo;
    image.alt = `${record.city}见面照片 ${index + 1}`;
    wrapper.append(image);
    elements.photoGrid.append(wrapper);
  });
}

function selectRecord(id) {
  activeId = id;
  render();
}

function openDialog() {
  elements.form.reset();
  elements.dialog.showModal();
}

function closeDialog() {
  elements.dialog.close();
}

function readPhotosAsDataUrls(files) {
  return Promise.all(
    [...files].map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.addEventListener("load", () => resolve(reader.result));
          reader.readAsDataURL(file);
        })
    )
  );
}

async function uploadPhotos(recordId, files) {
  const uploaded = [];

  for (const file of files) {
    const path = `${recordId}/${Date.now()}-${file.name.replaceAll(" ", "-")}`;
    const { error } = await cloud.storage.from(photoBucket).upload(path, file);

    if (error) {
      throw error;
    }

    const { data } = cloud.storage.from(photoBucket).getPublicUrl(path);
    uploaded.push(data.publicUrl);
  }

  return uploaded;
}

async function handleSubmit(event) {
  event.preventDefault();

  const submitButton = elements.form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "保存中...";

  try {
    const formData = new FormData(elements.form);
    const record = {
      id: `record-${Date.now()}`,
      city: formData.get("city").trim(),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      stay: formData.get("stay").trim(),
      scene: formData.get("scene").trim(),
      note: formData.get("note").trim(),
      photos: []
    };

    if (cloudEnabled) {
      record.photos = await uploadPhotos(record.id, elements.form.photos.files);
      const { error } = await cloud.from(tableName).insert(toCloudRecord(record));

      if (error) {
        throw error;
      }

      activeId = record.id;
      closeDialog();
      await loadCloudRecords();
    } else {
      record.photos = await readPhotosAsDataUrls(elements.form.photos.files);
      records = [...records, record];
      activeId = record.id;
      saveLocalRecords();
      closeDialog();
      render();
    }
  } catch {
    alert("保存失败，请检查 Supabase 配置和网络后再试。");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "保存记录";
  }
}

async function resetDemoRecords() {
  records = demoRecords;
  activeId = records[0].id;

  if (cloudEnabled) {
    const { error } = await cloud.from(tableName).upsert(demoRecords.map(toCloudRecord));

    if (error) {
      alert("恢复示例失败，请检查 Supabase 配置。");
      return;
    }

    await loadCloudRecords();
    return;
  }

  saveLocalRecords();
  render();
}

function exportRecords() {
  const data = JSON.stringify(records, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `异地恋见面记录-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importRecords() {
  elements.importFile.click();
}

function readImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsText(file);
  });
}

function isValidRecord(record) {
  return (
    record &&
    typeof record.id === "string" &&
    typeof record.city === "string" &&
    typeof record.startDate === "string" &&
    typeof record.stay === "string" &&
    typeof record.scene === "string" &&
    typeof record.note === "string" &&
    Array.isArray(record.photos)
  );
}

async function handleImport(event) {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  try {
    const imported = JSON.parse(await readImportFile(file));

    if (!Array.isArray(imported) || imported.length === 0 || !imported.every(isValidRecord)) {
      throw new Error("Invalid records file");
    }

    records = imported;
    activeId = records[0].id;

    if (cloudEnabled) {
      const { error } = await cloud.from(tableName).upsert(records.map(toCloudRecord));

      if (error) {
        throw error;
      }

      await loadCloudRecords();
    } else {
      saveLocalRecords();
      render();
    }
  } catch {
    alert("导入失败，请选择这个网页导出的记录文件。");
  } finally {
    elements.importFile.value = "";
  }
}

elements.openForm.addEventListener("click", openDialog);
elements.exportRecords.addEventListener("click", exportRecords);
elements.importRecords.addEventListener("click", importRecords);
elements.importFile.addEventListener("change", handleImport);
elements.closeForm.addEventListener("click", closeDialog);
elements.cancelForm.addEventListener("click", closeDialog);
elements.resetDemo.addEventListener("click", resetDemoRecords);
elements.form.addEventListener("submit", handleSubmit);
