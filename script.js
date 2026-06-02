const STORAGE_KEY = "long-distance-meeting-records";

const cityPositions = {
  北京: { lat: 39.9042, lng: 116.4074 },
  上海: { lat: 31.2304, lng: 121.4737 },
  杭州: { lat: 30.2741, lng: 120.1551 },
  南京: { lat: 32.0603, lng: 118.7969 },
  广州: { lat: 23.1291, lng: 113.2644 },
  深圳: { lat: 22.5431, lng: 114.0579 },
  成都: { lat: 30.5728, lng: 104.0668 },
  重庆: { lat: 29.563, lng: 106.5516 },
  武汉: { lat: 30.5928, lng: 114.3055 },
  西安: { lat: 34.3416, lng: 108.9398 },
  厦门: { lat: 24.4798, lng: 118.0894 },
  青岛: { lat: 36.0671, lng: 120.3826 },
  长沙: { lat: 28.2282, lng: 112.9388 },
  香港: { lat: 22.3193, lng: 114.1694 }
};

const demoRecords = [
  {
    id: "demo-shanghai",
    city: "上海",
    placeName: "外滩观景平台",
    latitude: 31.2407,
    longitude: 121.4908,
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
    placeName: "西湖断桥",
    latitude: 30.2586,
    longitude: 120.1494,
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
    placeName: "珠江新城",
    latitude: 23.1199,
    longitude: 113.3236,
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
const mapEnabled = Boolean(config.baiduAk);

const elements = {
  mapCanvas: document.querySelector("#map-canvas"),
  mapLoading: document.querySelector("#map-loading"),
  markerLayer: document.querySelector("#marker-layer"),
  timeline: document.querySelector("#timeline"),
  photoGrid: document.querySelector("#photo-grid"),
  totalCount: document.querySelector("#total-count"),
  cityCount: document.querySelector("#city-count"),
  detailCity: document.querySelector("#detail-city"),
  detailTime: document.querySelector("#detail-time"),
  detailPlace: document.querySelector("#detail-place"),
  detailStay: document.querySelector("#detail-stay"),
  detailScene: document.querySelector("#detail-scene"),
  detailNote: document.querySelector("#detail-note"),
  syncStatus: document.querySelector("#sync-status"),
  openForm: document.querySelector("#open-form"),
  editRecord: document.querySelector("#edit-record"),
  deleteRecord: document.querySelector("#delete-record"),
  searchCity: document.querySelector("#search-city"),
  selectedCity: document.querySelector("#selected-city"),
  cityResults: document.querySelector("#city-results"),
  searchPlace: document.querySelector("#search-place"),
  selectedPlace: document.querySelector("#selected-place"),
  placeResults: document.querySelector("#place-results"),
  exportRecords: document.querySelector("#export-records"),
  importRecords: document.querySelector("#import-records"),
  importFile: document.querySelector("#import-file"),
  closeForm: document.querySelector("#close-form"),
  cancelForm: document.querySelector("#cancel-form"),
  resetDemo: document.querySelector("#reset-demo"),
  dialog: document.querySelector("#record-dialog"),
  form: document.querySelector("#record-form")
};

const mapState = {
  map: null,
  ready: false,
  markerLabels: new Map()
};

let records = [];
let activeId = null;
let editingId = null;
let selectedCity = null;
let selectedPlace = null;

init();

async function init() {
  await initMap();
  setStatus(cloudEnabled ? "正在连接云端..." : "本地模式：填写 config.js 后开启云端同步");

  if (cloudEnabled) {
    await loadCloudRecords();
    subscribeToCloudChanges();
  } else {
    records = loadLocalRecords();
    activeId = records[0]?.id ?? null;
    await ensureRecordLocations(false);
    render();
  }
}

async function initMap() {
  if (!mapEnabled) {
    elements.mapLoading.textContent = "请先在 config.js 填写百度地图 baiduAk";
    return;
  }

  try {
    await loadBaiduMap();
    const center = new BMapGL.Point(116.4074, 39.9042);
    mapState.map = new BMapGL.Map("map-canvas");
    mapState.map.centerAndZoom(center, 5);
    mapState.map.enableScrollWheelZoom(true);
    mapState.ready = true;
    elements.mapLoading.hidden = true;

    ["zoomend", "moveend", "moving", "resize"].forEach((eventName) => {
      mapState.map.addEventListener(eventName, positionMarkerLabels);
    });
  } catch {
    elements.mapLoading.textContent = "百度地图加载失败，请检查 baiduAk";
  }
}

function loadBaiduMap() {
  if (window.BMapGL) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const callbackName = `initBaiduMap${Date.now()}`;
    const script = document.createElement("script");

    window[callbackName] = () => {
      delete window[callbackName];
      resolve();
    };

    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${encodeURIComponent(
      config.baiduAk
    )}&callback=${callbackName}`;
    script.onerror = reject;
    document.head.append(script);
  });
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
    await ensureRecordLocations(false);
    render();
    return;
  }

  records = data.map(fromCloudRecord);
  activeId = records.find((record) => record.id === activeId)?.id ?? records[0]?.id ?? null;
  setStatus(records.length > 0 ? "云端同步已开启" : "云端同步已开启，还没有记录");
  await ensureRecordLocations(true);
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
    placeName: record.place_name ?? "",
    latitude: record.latitude ?? null,
    longitude: record.longitude ?? null,
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
    place_name: record.placeName || null,
    latitude: Number.isFinite(record.latitude) ? record.latitude : null,
    longitude: Number.isFinite(record.longitude) ? record.longitude : null,
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

function formatPlace(record) {
  return record.placeName || record.city;
}

function hasPreciseCoordinates(record) {
  return Number.isFinite(record.latitude) && Number.isFinite(record.longitude);
}

function getCoordinates(record) {
  if (hasPreciseCoordinates(record)) {
    return { lat: record.latitude, lng: record.longitude };
  }

  return cityPositions[record.city] ?? null;
}

async function ensureRecordLocations(shouldPersist) {
  if (!mapState.ready) {
    return;
  }

  const updates = [];

  for (const record of records) {
    if (hasPreciseCoordinates(record)) {
      continue;
    }

    try {
      const located = await searchPlace(record);
      record.latitude = located.latitude;
      record.longitude = located.longitude;

      if (!record.placeName && located.placeName) {
        record.placeName = located.placeName;
      }

      updates.push(record);
    } catch {
      const fallback = cityPositions[record.city];
      if (fallback) {
        record.latitude = fallback.lat;
        record.longitude = fallback.lng;
      }
    }
  }

  if (cloudEnabled && shouldPersist && updates.length > 0) {
    await Promise.all(
      updates.map((record) => cloud.from(tableName).update(toCloudRecord(record)).eq("id", record.id))
    );
  }
}

function searchPlace(record) {
  if (!mapState.ready) {
    return Promise.reject(new Error("Map is not ready"));
  }

  const keyword = record.placeName || record.city;
  const location = record.city || mapState.map;

  return new Promise((resolve, reject) => {
    const localSearch = new BMapGL.LocalSearch(location, {
      onSearchComplete: (results) => {
        const status = localSearch.getStatus();
        const success = status === 0 || status === window.BMAP_STATUS_SUCCESS;

        if (!success || !results || results.getCurrentNumPois() === 0) {
          reject(new Error("Place not found"));
          return;
        }

        const poi = results.getPoi(0);
        resolve({
          latitude: poi.point.lat,
          longitude: poi.point.lng,
          placeName: poi.title || keyword
        });
      }
    });

    localSearch.search(keyword);
  });
}

function searchPlaceCandidates(city, keyword) {
  if (!mapState.ready || !keyword.trim()) {
    return Promise.reject(new Error("Map is not ready"));
  }

  return new Promise((resolve, reject) => {
    const localSearch = new BMapGL.LocalSearch(city || mapState.map, {
      onSearchComplete: (results) => {
        const status = localSearch.getStatus();
        const success = status === 0 || status === window.BMAP_STATUS_SUCCESS;

        if (!success || !results || results.getCurrentNumPois() === 0) {
          reject(new Error("Place not found"));
          return;
        }

        const candidates = [];
        const count = Math.min(results.getCurrentNumPois(), 6);

        for (let index = 0; index < count; index += 1) {
          const poi = results.getPoi(index);

          if (!poi?.point) {
            continue;
          }

          candidates.push({
            title: poi.title || keyword,
            address: poi.address || "",
            city: city || "",
            latitude: poi.point.lat,
            longitude: poi.point.lng
          });
        }

        candidates.length > 0 ? resolve(candidates) : reject(new Error("Place not found"));
      }
    });

    localSearch.search(keyword.trim());
  });
}

function getSearchCity() {
  return selectedCity?.title || elements.form.city.value.trim();
}

async function resolveRecordLocation(record) {
  if (selectedPlace && selectedPlace.title === record.placeName) {
    return {
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      placeName: selectedPlace.title
    };
  }

  try {
    return await searchPlace(record);
  } catch {
    if (selectedCity && selectedCity.title === record.city) {
      return {
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
        placeName: record.city
      };
    }

    const cityOnlyRecord = { ...record, placeName: "" };

    try {
      return await searchPlace(cityOnlyRecord);
    } catch {
      const fallback = cityPositions[record.city];

      if (fallback) {
        return {
          latitude: fallback.lat,
          longitude: fallback.lng,
          placeName: record.city
        };
      }

      throw new Error("Location not found");
    }
  }
}

function sortedRecords() {
  return [...records].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

function render() {
  const ordered = sortedRecords();
  elements.totalCount.textContent = records.length;
  elements.cityCount.textContent = new Set(records.map((record) => record.city)).size;

  renderMarkers(ordered);
  renderTimeline(ordered);
  renderDetail(records.find((record) => record.id === activeId) ?? ordered[0]);
}

function renderMarkers(ordered) {
  elements.markerLayer.innerHTML = "";
  mapState.markerLabels.clear();

  if (!mapState.ready) {
    return;
  }

  ordered.forEach((record, index) => {
    const coordinates = getCoordinates(record);

    if (!coordinates) {
      return;
    }

    const button = document.createElement("button");
    button.className = `map-marker${record.id === activeId ? " active" : ""}`;
    button.dataset.city = record.placeName || record.city;
    button.type = "button";
    button.ariaLabel = `查看${record.placeName || record.city}的见面记录`;
    button.textContent = String(index + 1).padStart(2, "0");
    button.addEventListener("click", () => selectRecord(record.id));
    elements.markerLayer.append(button);

    mapState.markerLabels.set(record.id, {
      label: button,
      point: new BMapGL.Point(coordinates.lng, coordinates.lat)
    });
  });

  positionMarkerLabels();
  focusMapOnRecord(records.find((record) => record.id === activeId), false);
}

function positionMarkerLabels() {
  if (!mapState.ready) {
    return;
  }

  mapState.markerLabels.forEach(({ label, point }) => {
    const pixel = mapState.map.pointToOverlayPixel
      ? mapState.map.pointToOverlayPixel(point)
      : mapState.map.pointToPixel(point);
    label.style.left = `${pixel.x}px`;
    label.style.top = `${pixel.y}px`;
  });
}

function focusMapOnRecord(record, shouldZoom = true) {
  if (!mapState.ready || !record) {
    return;
  }

  const coordinates = getCoordinates(record);
  if (!coordinates) {
    return;
  }

  const point = new BMapGL.Point(coordinates.lng, coordinates.lat);
  const targetZoom = shouldZoom ? Math.max(mapState.map.getZoom(), 15) : mapState.map.getZoom();
  mapState.map.centerAndZoom(point, targetZoom);
  window.setTimeout(positionMarkerLabels, 80);
}

function renderTimeline(ordered) {
  elements.timeline.innerHTML = "";

  ordered.forEach((record) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = record.id === activeId ? "active" : "";
    button.type = "button";
    button.innerHTML = `<strong>${record.placeName || record.city} · ${record.scene}</strong><span>${record.city} · ${formatDateRange(record)}</span>`;
    button.addEventListener("click", () => selectRecord(record.id));
    item.append(button);
    elements.timeline.append(item);
  });
}

function renderDetail(record) {
  if (!record) {
    elements.editRecord.disabled = true;
    elements.deleteRecord.disabled = true;
    elements.detailCity.textContent = "还没有记录";
    elements.detailTime.textContent = "-";
    elements.detailPlace.textContent = "-";
    elements.detailStay.textContent = "-";
    elements.detailScene.textContent = "-";
    elements.detailNote.textContent = "点击“新增记录”，把你们下一次见面写进地图。";
    elements.photoGrid.innerHTML = "";
    return;
  }

  elements.editRecord.disabled = false;
  elements.deleteRecord.disabled = false;
  activeId = record.id;
  elements.detailCity.textContent = record.city;
  elements.detailTime.textContent = formatDateRange(record);
  elements.detailPlace.textContent = formatPlace(record);
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
  focusMapOnRecord(records.find((record) => record.id === id));
}

function openDialog(record = null) {
  elements.form.reset();
  clearSelectedCity();
  clearSelectedPlace();
  editingId = record?.id ?? null;
  document.querySelector("#dialog-title").textContent = editingId ? "编辑见面记录" : "新增见面记录";
  elements.form.querySelector('button[type="submit"]').textContent = editingId ? "保存修改" : "保存记录";

  if (record) {
    elements.form.city.value = record.city;
    if (hasPreciseCoordinates(record)) {
      selectedCity = {
        title: record.city,
        address: "",
        latitude: record.latitude,
        longitude: record.longitude
      };
      elements.selectedCity.textContent = `已选择：${selectedCity.title}`;
    }
    elements.form.placeName.value = record.placeName || "";
    if (hasPreciseCoordinates(record)) {
      selectedPlace = {
        title: record.placeName || record.city,
        address: "",
        city: record.city,
        latitude: record.latitude,
        longitude: record.longitude
      };
      elements.selectedPlace.textContent = `已选择：${selectedPlace.title}`;
    }
    elements.form.startDate.value = record.startDate;
    elements.form.endDate.value = record.endDate || "";
    elements.form.stay.value = record.stay;
    elements.form.scene.value = record.scene;
    elements.form.note.value = record.note;
  }

  elements.dialog.showModal();
}

function closeDialog() {
  editingId = null;
  elements.dialog.close();
}

function openEditDialog() {
  const record = records.find((item) => item.id === activeId);

  if (!record) {
    return;
  }

  openDialog(record);
}

function clearSelectedCity() {
  selectedCity = null;
  elements.selectedCity.textContent = "未选择地图城市";
  elements.cityResults.innerHTML = "";
}

function clearSelectedPlace() {
  selectedPlace = null;
  elements.selectedPlace.textContent = "未选择地图地点";
  elements.placeResults.innerHTML = "";
}

async function handleCitySearch() {
  const keyword = elements.form.city.value.trim();

  clearSelectedCity();
  clearSelectedPlace();

  if (!mapState.ready) {
    elements.cityResults.textContent = "地图还没加载好，请稍后再试。";
    return;
  }

  if (!keyword) {
    elements.cityResults.textContent = "先输入城市，比如“北京”。";
    return;
  }

  elements.cityResults.textContent = "正在搜索...";

  try {
    const candidates = await searchPlaceCandidates("", keyword);
    renderCityCandidates(candidates);
  } catch {
    elements.cityResults.textContent = "没有找到城市。可以换成“北京市”“上海市”这样的完整名称。";
  }
}

async function handlePlaceSearch() {
  const city = getSearchCity();
  const keyword = elements.form.placeName.value.trim();

  clearSelectedPlace();

  if (!mapState.ready) {
    elements.placeResults.textContent = "地图还没加载好，请稍后再试。";
    return;
  }

  if (!keyword) {
    elements.placeResults.textContent = "先输入一个具体地点，比如“北京南站”。";
    return;
  }

  elements.placeResults.textContent = "正在搜索...";

  try {
    const candidates = await searchPlaceCandidates(city, keyword);
    renderPlaceCandidates(candidates);
  } catch {
    elements.placeResults.textContent = "没有找到地点。可以换一个更完整的名称，比如“北京南站”。";
  }
}

function renderPlaceCandidates(candidates) {
  elements.placeResults.innerHTML = "";

  candidates.forEach((candidate) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "place-result";
    button.innerHTML = `<strong>${candidate.title}</strong><span>${candidate.address || "百度地图搜索结果"}</span>`;
    button.addEventListener("click", () => {
      selectedPlace = candidate;
      elements.form.placeName.value = candidate.title;
      elements.selectedPlace.textContent = `已选择：${candidate.title}`;
      elements.placeResults.innerHTML = "";
    });
    elements.placeResults.append(button);
  });
}

function renderCityCandidates(candidates) {
  elements.cityResults.innerHTML = "";

  candidates.forEach((candidate) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "place-result";
    button.innerHTML = `<strong>${candidate.title}</strong><span>${candidate.address || "百度地图搜索结果"}</span>`;
    button.addEventListener("click", () => {
      selectedCity = candidate;
      elements.form.city.value = candidate.title;
      elements.selectedCity.textContent = `已选择：${candidate.title}`;
      elements.cityResults.innerHTML = "";
      clearSelectedPlace();
    });
    elements.cityResults.append(button);
  });
}

function handleCityInputChange() {
  if (selectedCity && elements.form.city.value.trim() !== selectedCity.title) {
    clearSelectedCity();
    clearSelectedPlace();
  }
}

function handlePlaceInputChange() {
  if (selectedPlace && elements.form.placeName.value.trim() !== selectedPlace.title) {
    clearSelectedPlace();
  }
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

  if (!mapState.ready) {
    alert("请先在 config.js 填写百度地图 baiduAk，地图加载后才能自动搜索地点。");
    return;
  }

  const submitButton = elements.form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "保存中...";

  try {
    const formData = new FormData(elements.form);
    const originalRecord = records.find((item) => item.id === editingId);
    const recordId = editingId || `record-${Date.now()}`;
    const record = {
      id: recordId,
      city: selectedCity?.title || formData.get("city").trim(),
      placeName: formData.get("placeName").trim(),
      latitude: null,
      longitude: null,
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      stay: formData.get("stay").trim(),
      scene: formData.get("scene").trim(),
      note: formData.get("note").trim(),
      photos: originalRecord?.photos ?? []
    };
    if (selectedPlace && selectedPlace.title === record.placeName) {
      record.latitude = selectedPlace.latitude;
      record.longitude = selectedPlace.longitude;
      record.placeName = selectedPlace.title;
    } else if (selectedCity && selectedCity.title === record.city && !record.placeName) {
      record.latitude = selectedCity.latitude;
      record.longitude = selectedCity.longitude;
    }
    let located;
    try {
      located = await resolveRecordLocation(record);
    } catch {
      throw new Error("没有定位到这个城市或地点，请先点“搜索城市”或“搜索地点”并选择一个结果。");
    }

    record.latitude = located.latitude;
    record.longitude = located.longitude;
    record.placeName = record.placeName || located.placeName;

    if (cloudEnabled) {
      try {
        record.photos = [
          ...record.photos,
          ...(await uploadPhotos(record.id, elements.form.photos.files))
        ];
      } catch {
        throw new Error("照片上传失败，请稍后再试，或先不选照片保存。");
      }

      const request = editingId
        ? cloud.from(tableName).update(toCloudRecord(record)).eq("id", record.id)
        : cloud.from(tableName).insert(toCloudRecord(record));
      const { error } = await request;

      if (error) {
        throw new Error(`云端保存失败：${error.message || error.details || "请检查 Supabase 表字段和权限"}`);
      }

      activeId = record.id;
      closeDialog();
      await loadCloudRecords();
    } else {
      record.photos = [
        ...record.photos,
        ...(await readPhotosAsDataUrls(elements.form.photos.files))
      ];
      records = editingId
        ? records.map((item) => (item.id === record.id ? record : item))
        : [...records, record];
      activeId = record.id;
      saveLocalRecords();
      closeDialog();
      render();
    }

    focusMapOnRecord(record);
  } catch (error) {
    console.error(error);
    alert(`保存失败：${error.message || "未知错误"}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = editingId ? "保存修改" : "保存记录";
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

async function deleteActiveRecord() {
  const record = records.find((item) => item.id === activeId);

  if (!record) {
    return;
  }

  const confirmed = confirm(`确定删除「${record.placeName || record.city}」这条记录吗？`);

  if (!confirmed) {
    return;
  }

  if (cloudEnabled) {
    const { error } = await cloud.from(tableName).delete().eq("id", record.id);

    if (error) {
      alert("删除失败，请确认 Supabase 已经添加 delete 权限。");
      return;
    }

    await loadCloudRecords();
    return;
  }

  records = records.filter((item) => item.id !== record.id);
  activeId = records[0]?.id ?? null;
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
    (typeof record.placeName === "string" || record.placeName === undefined) &&
    (typeof record.latitude === "number" || record.latitude === null || record.latitude === undefined) &&
    (typeof record.longitude === "number" || record.longitude === null || record.longitude === undefined) &&
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
    await ensureRecordLocations(false);

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

elements.openForm.addEventListener("click", () => openDialog());
elements.editRecord.addEventListener("click", openEditDialog);
elements.deleteRecord.addEventListener("click", deleteActiveRecord);
elements.searchCity.addEventListener("click", handleCitySearch);
elements.searchPlace.addEventListener("click", handlePlaceSearch);
elements.form.city.addEventListener("input", handleCityInputChange);
elements.form.placeName.addEventListener("input", handlePlaceInputChange);
elements.exportRecords.addEventListener("click", exportRecords);
elements.importRecords.addEventListener("click", importRecords);
elements.importFile.addEventListener("change", handleImport);
elements.closeForm.addEventListener("click", closeDialog);
elements.cancelForm.addEventListener("click", closeDialog);
elements.resetDemo.addEventListener("click", resetDemoRecords);
elements.form.addEventListener("submit", handleSubmit);
