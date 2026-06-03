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
    places: [{ name: "外滩观景平台", latitude: 31.2407, longitude: 121.4908 }],
    startDate: "2025-10-02",
    endDate: "2025-10-05",
    stay: "外滩附近的小酒店",
    stayLatitude: 31.239,
    stayLongitude: 121.484,
    scene: "第一次国庆见面",
    note: "晚上一起沿着外滩慢慢走，江风很舒服。那天人很多，但还是觉得整个城市都像只剩下我们两个人。",
    dailyEvents: [
      { date: "2025-10-02", text: "到上海见面，晚上一起沿着外滩散步。" },
      { date: "2025-10-03", text: "吃小笼包，拍了很多夜景照片。" }
    ],
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
    places: [{ name: "西湖断桥", latitude: 30.2586, longitude: 120.1494 }],
    startDate: "2026-01-18",
    endDate: "2026-01-20",
    stay: "西湖边的民宿",
    stayLatitude: 30.258,
    stayLongitude: 120.153,
    scene: "冬天一起看湖",
    note: "早上买了热豆浆和小笼包，坐在湖边等太阳出来。没有安排很多行程，只是一起散步也很开心。",
    dailyEvents: [
      { date: "2026-01-18", text: "到杭州入住民宿，晚上一起吃热乎的面。" },
      { date: "2026-01-19", text: "沿西湖散步，在断桥附近等太阳出来。" }
    ],
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
    places: [{ name: "珠江新城", latitude: 23.1199, longitude: 113.3236 }],
    startDate: "2026-04-04",
    endDate: "2026-04-06",
    stay: "珠江新城附近",
    stayLatitude: 23.1199,
    stayLongitude: 113.3236,
    scene: "清明小长假",
    note: "一起吃了早茶，点了太多东西，最后两个人撑到说不出话。晚上坐地铁回去的时候，她靠着我睡着了。",
    dailyEvents: [
      { date: "2026-04-04", text: "一起吃早茶，晚上去珠江边散步。" },
      { date: "2026-04-05", text: "在珠江新城附近逛街，坐地铁回去。" }
    ],
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
  baiduMap: document.querySelector("#baidu-map"),
  mapLoading: document.querySelector("#map-loading"),
  countryGlobe: document.querySelector("#country-globe"),
  nightMapStage: document.querySelector("#night-map-stage"),
  globeRoot: document.querySelector("#globe-root"),
  nightZoomIn: document.querySelector("#night-zoom-in"),
  nightZoomOut: document.querySelector("#night-zoom-out"),
  nightReset: document.querySelector("#night-reset"),
  globePins: document.querySelector("#globe-pins"),
  markerLayer: document.querySelector("#marker-layer"),
  timeline: document.querySelector("#timeline"),
  photoGrid: document.querySelector("#photo-grid"),
  totalCount: document.querySelector("#total-count"),
  cityCount: document.querySelector("#city-count"),
  detailCity: document.querySelector("#detail-city"),
  detailTime: document.querySelector("#detail-time"),
  detailPlace: document.querySelector("#detail-place"),
  detailStay: document.querySelector("#detail-stay"),
  detailNote: document.querySelector("#detail-note"),
  dailyEvents: document.querySelector("#daily-events"),
  dailyEventsList: document.querySelector("#daily-events-list"),
  addDailyEvent: document.querySelector("#add-daily-event"),
  syncStatus: document.querySelector("#sync-status"),
  openForm: document.querySelector("#open-form"),
  editRecord: document.querySelector("#edit-record"),
  deleteRecord: document.querySelector("#delete-record"),
  searchCity: document.querySelector("#search-city"),
  selectedCity: document.querySelector("#selected-city"),
  cityResults: document.querySelector("#city-results"),
  searchStay: document.querySelector("#search-stay"),
  selectedStay: document.querySelector("#selected-stay"),
  stayResults: document.querySelector("#stay-results"),
  placesList: document.querySelector("#places-list"),
  addPlace: document.querySelector("#add-place"),
  showCountry: document.querySelector("#show-country"),
  closeForm: document.querySelector("#close-form"),
  cancelForm: document.querySelector("#cancel-form"),
  resetDemo: document.querySelector("#reset-demo"),
  dialog: document.querySelector("#record-dialog"),
  form: document.querySelector("#record-form")
};

const formFields = {
  city: document.querySelector('[name="city"]'),
  startDate: document.querySelector('[name="startDate"]'),
  endDate: document.querySelector('[name="endDate"]'),
  stay: document.querySelector('[name="stay"]'),
  note: document.querySelector('[name="note"]'),
  photos: document.querySelector('[name="photos"]')
};

const mapState = {
  map: null,
  ready: false,
  overlays: []
};

let records = [];
let activeId = null;
let activeCity = null;
let editingId = null;
let selectedCity = null;
let selectedStay = null;
const earthState = {
  globe: null,
  renderer: null,
  scene: null,
  camera: null,
  group: null,
  animationFrame: null,
  resizeObserver: null,
  pinData: [],
  dragging: false,
  lastX: 0,
  lastY: 0,
  rotationX: 0.3,
  rotationY: 0,
  cameraZ: 5.1
};

init();

async function init() {
  initEarthGlobe();
  initEarthInteraction();
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
    const center = new BMapGL.Point(104.1954, 35.8617);
    mapState.map = new BMapGL.Map("baidu-map");
    mapState.map.centerAndZoom(center, 5);
    mapState.map.enableScrollWheelZoom(true);
    mapState.ready = true;
    elements.mapLoading.hidden = true;
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
  const places = Array.isArray(record.places) ? record.places : [];

  return {
    id: record.id,
    city: record.city,
    placeName: record.place_name ?? "",
    latitude: record.latitude ?? null,
    longitude: record.longitude ?? null,
    places,
    startDate: record.start_date,
    endDate: record.end_date ?? "",
    stay: record.stay,
    stayLatitude: record.stay_latitude ?? null,
    stayLongitude: record.stay_longitude ?? null,
    scene: record.scene ?? "",
    note: record.note,
    dailyEvents: record.daily_events ?? [],
    photos: record.photos ?? []
  };
}

function toCloudRecord(record) {
  const places = getRecordPlaces(record);
  const primaryPlace = places[0];

  return {
    id: record.id,
    city: record.city,
    place_name: primaryPlace?.name || record.placeName || null,
    latitude: Number.isFinite(primaryPlace?.latitude) ? primaryPlace.latitude : Number.isFinite(record.latitude) ? record.latitude : null,
    longitude: Number.isFinite(primaryPlace?.longitude) ? primaryPlace.longitude : Number.isFinite(record.longitude) ? record.longitude : null,
    places,
    start_date: record.startDate,
    end_date: record.endDate || null,
    stay: record.stay,
    stay_latitude: Number.isFinite(record.stayLatitude) ? record.stayLatitude : null,
    stay_longitude: Number.isFinite(record.stayLongitude) ? record.stayLongitude : null,
    scene: record.scene || "",
    note: record.note,
    daily_events: record.dailyEvents ?? [],
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

function normalizePlace(place) {
  return {
    name: (place.name || place.title || "").trim(),
    latitude: Number.isFinite(place.latitude) ? place.latitude : null,
    longitude: Number.isFinite(place.longitude) ? place.longitude : null
  };
}

function getRecordPlaces(record) {
  const places = Array.isArray(record.places)
    ? record.places.map(normalizePlace).filter((place) => place.name)
    : [];

  if (places.length > 0) {
    return places;
  }

  if (record.placeName) {
    return [
      {
        name: record.placeName,
        latitude: Number.isFinite(record.latitude) ? record.latitude : null,
        longitude: Number.isFinite(record.longitude) ? record.longitude : null
      }
    ];
  }

  return [];
}

function formatPlace(record) {
  const places = getRecordPlaces(record);
  return places.length > 0 ? places.map((place) => place.name).join("、") : record.city;
}

function hasPreciseCoordinates(record) {
  return Number.isFinite(record.latitude) && Number.isFinite(record.longitude);
}

function getCoordinates(record) {
  const precisePlace = getRecordPlaces(record).find(
    (place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude)
  );

  if (precisePlace) {
    return { lat: precisePlace.latitude, lng: precisePlace.longitude };
  }

  if (hasPreciseCoordinates(record)) {
    return { lat: record.latitude, lng: record.longitude };
  }

  return cityPositions[record.city] ?? null;
}

function hasStayCoordinates(record) {
  return Number.isFinite(record.stayLatitude) && Number.isFinite(record.stayLongitude);
}

function getStayCoordinates(record) {
  return hasStayCoordinates(record) ? { lat: record.stayLatitude, lng: record.stayLongitude } : null;
}

async function ensureRecordLocations(shouldPersist) {
  if (!mapState.ready) {
    return;
  }

  const updates = [];

  for (const record of records) {
    const currentPlaces = getRecordPlaces(record);
    const allPlacesLocated =
      currentPlaces.length > 0 &&
      currentPlaces.every((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));

    const stayLocated = !record.stay || hasStayCoordinates(record);

    if (hasPreciseCoordinates(record) && allPlacesLocated && stayLocated) {
      continue;
    }

    try {
      record.places = await resolveRecordPlaces(record);
      const primaryPlace = record.places[0];
      record.placeName = primaryPlace?.name || record.placeName;
      record.latitude = primaryPlace?.latitude ?? record.latitude;
      record.longitude = primaryPlace?.longitude ?? record.longitude;

      if (record.stay && !hasStayCoordinates(record)) {
        const stayLocation = await resolveStayLocation(record);
        record.stayLatitude = stayLocation.latitude;
        record.stayLongitude = stayLocation.longitude;
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
  return selectedCity?.title || formFields.city.value.trim();
}

async function resolvePlaceLocation(city, place) {
  if (Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
    return place;
  }

  if (place.name) {
    try {
      const [candidate] = await searchPlaceCandidates(city, place.name);

      if (candidate) {
        return {
          name: candidate.title,
          latitude: candidate.latitude,
          longitude: candidate.longitude
        };
      }
    } catch {
      // Continue to city fallback below.
    }
  }

  const fallback = cityPositions[city];

  if (fallback) {
    return {
      name: place.name || city,
      latitude: fallback.lat,
      longitude: fallback.lng
    };
  }

  throw new Error("Location not found");
}

async function resolveStayLocation(record) {
  if (selectedStay && selectedStay.title === record.stay) {
    return {
      latitude: selectedStay.latitude,
      longitude: selectedStay.longitude
    };
  }

  if (hasStayCoordinates(record)) {
    return {
      latitude: record.stayLatitude,
      longitude: record.stayLongitude
    };
  }

  const [candidate] = await searchPlaceCandidates(record.city || getSearchCity(), record.stay);

  return {
    latitude: candidate.latitude,
    longitude: candidate.longitude
  };
}

async function resolveRecordPlaces(record) {
  const places = getRecordPlaces(record);
  const city = record.city || getSearchCity();

  if (places.length > 0) {
    return Promise.all(places.map((place) => resolvePlaceLocation(city, place)));
  }

  try {
    const [cityCandidate] = await searchPlaceCandidates("", city);

    if (cityCandidate) {
      return [
        {
          name: city,
          latitude: cityCandidate.latitude,
          longitude: cityCandidate.longitude
        }
      ];
    }
  } catch {
    if (selectedCity && selectedCity.title === city) {
      return [
        {
          name: city,
          latitude: selectedCity.latitude,
          longitude: selectedCity.longitude
        }
      ];
    }

    const fallback = cityPositions[city];

    if (fallback) {
      return [
        {
          name: city,
          latitude: fallback.lat,
          longitude: fallback.lng
        }
      ];
    }
  }

  throw new Error("Location not found");
}

function sortedRecords() {
  return [...records].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

function groupRecordsByCity() {
  const groups = new Map();

  sortedRecords().forEach((record) => {
    if (!groups.has(record.city)) {
      groups.set(record.city, []);
    }

    groups.get(record.city).push(record);
  });

  return groups;
}

function getCityCoordinates(city, cityRecords) {
  const preciseRecord = cityRecords.find(hasPreciseCoordinates);

  if (preciseRecord) {
    return { lat: preciseRecord.latitude, lng: preciseRecord.longitude };
  }

  return cityPositions[city] ?? null;
}

function toDateInputValue(dateText) {
  const match = String(dateText || "").match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);

  if (!match) {
    return "";
  }

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeDailyEvent(event) {
  if (typeof event === "string") {
    return normalizeDailyEvent({ date: "", text: event });
  }

  let date = toDateInputValue(event?.date);
  let text = (event?.text || "").trim();

  if (!date) {
    const leadingDate = text.match(/^(\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}日?)\s*/);

    if (leadingDate) {
      date = toDateInputValue(leadingDate[1]);
      text = text.slice(leadingDate[0].length).trim();
    }
  }

  return {
    date,
    text
  };
}

function createDailyEventRow(event = {}) {
  const row = document.createElement("div");
  const dateInput = document.createElement("input");
  const textInput = document.createElement("textarea");
  const removeButton = document.createElement("button");

  row.className = "daily-event-row";

  dateInput.className = "daily-event-date";
  dateInput.type = "date";
  dateInput.min = formFields.startDate.value || "";
  dateInput.max = formFields.endDate.value || "";
  dateInput.value = event.date || formFields.startDate.value || "";

  textInput.className = "daily-event-text";
  textInput.rows = 2;
  textInput.placeholder = "例如：中午去朝阳站接她，晚上吃牛排";
  textInput.value = event.text || "";

  removeButton.className = "ghost-button remove-daily-event";
  removeButton.type = "button";
  removeButton.textContent = "删除";

  row.append(dateInput, textInput, removeButton);
  return row;
}

function addDailyEventRow(event = {}) {
  elements.dailyEventsList.append(createDailyEventRow(normalizeDailyEvent(event)));
}

function renderDailyEventRows(events = []) {
  elements.dailyEventsList.innerHTML = "";
  const rows = events.length > 0 ? events.map(normalizeDailyEvent) : [{}];
  rows.forEach(addDailyEventRow);
}

function readDailyEventRows() {
  const fallbackDate = formFields.startDate.value;

  return [...elements.dailyEventsList.querySelectorAll(".daily-event-row")]
    .map((row) => ({
      date: row.querySelector(".daily-event-date").value || fallbackDate,
      text: row.querySelector(".daily-event-text").value.trim()
    }))
    .filter((event) => event.text);
}

function syncDailyEventDateBounds() {
  const startDate = formFields.startDate.value;
  const endDate = formFields.endDate.value;

  elements.dailyEventsList.querySelectorAll(".daily-event-date").forEach((input) => {
    input.min = startDate;
    input.max = endDate;

    if (!input.value && startDate) {
      input.value = startDate;
    }
  });
}

function handleDailyEventsListClick(event) {
  const row = event.target.closest(".daily-event-row");

  if (!row || !event.target.classList.contains("remove-daily-event")) {
    return;
  }

  row.remove();

  if (elements.dailyEventsList.querySelectorAll(".daily-event-row").length === 0) {
    addDailyEventRow();
  }
}

function clearMapOverlays() {
  if (!mapState.ready) {
    return;
  }

  mapState.overlays.forEach((overlay) => mapState.map.removeOverlay(overlay));
  mapState.overlays = [];
}

function addMapMarker(point, labelText, type, onClick) {
  const marker = new BMapGL.Marker(point);
  const offset = type === "city" ? new BMapGL.Size(18, -28) : new BMapGL.Size(16, -24);
  const label = new BMapGL.Label(labelText, { offset });

  label.setStyle({
    border: type === "stay" ? "1px solid rgba(120, 184, 255, 0.42)" : "1px solid rgba(224, 191, 115, 0.35)",
    borderRadius: "999px",
    color: "#f8ead1",
    backgroundColor: "rgba(12, 18, 28, 0.84)",
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.32)",
    padding: "4px 8px",
    fontSize: "12px",
    lineHeight: "16px",
    whiteSpace: "nowrap"
  });

  marker.setLabel(label);
  marker.addEventListener("click", onClick);
  mapState.map.addOverlay(marker);
  mapState.overlays.push(marker);
  return marker;
}

function render() {
  const ordered = sortedRecords();
  const groups = groupRecordsByCity();
  const fallbackRecord = ordered[0];

  if (activeCity && !groups.has(activeCity)) {
    activeCity = null;
  }

  const visibleRecords = activeCity ? groups.get(activeCity) ?? [] : ordered;

  if (!visibleRecords.some((record) => record.id === activeId)) {
    activeId = visibleRecords[0]?.id ?? fallbackRecord?.id ?? null;
  }

  elements.totalCount.textContent = records.length;
  elements.cityCount.textContent = new Set(records.map((record) => record.city)).size;

  renderMarkers(groups);
  renderTimeline(visibleRecords);
  renderDetail(records.find((record) => record.id === activeId) ?? visibleRecords[0] ?? fallbackRecord);
}

function renderMarkers(groups) {
  elements.markerLayer.innerHTML = "";
  elements.globePins.innerHTML = "";
  clearMapOverlays();

  const shouldShowCityMap = Boolean(activeCity && groups.has(activeCity));
  elements.mapCanvas.classList.toggle("country-mode", !shouldShowCityMap);
  elements.mapCanvas.classList.toggle("city-mode", shouldShowCityMap);
  elements.countryGlobe.hidden = shouldShowCityMap;

  if (!shouldShowCityMap) {
    resizeEarthGlobe();
    renderGlobePins(groups);
    return;
  }

  if (!mapState.ready) {
    return;
  }

  renderPlaceMarkers(groups.get(activeCity));
}

function initEarthGlobe() {
  if (!elements.earthCanvas || !window.THREE) {
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, earthState.cameraZ);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: elements.earthCanvas
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const group = new THREE.Group();
  group.rotation.x = earthState.rotationX;
  group.rotation.y = earthState.rotationY;
  scene.add(group);

  const texture = createFallbackEarthTexture();

  const earthMaterial = new THREE.MeshPhongMaterial({
    map: texture,
    emissive: 0x0b1b2d,
    emissiveMap: texture,
    emissiveIntensity: 0.75,
    shininess: 8
  });
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(2, 96, 96),
    earthMaterial
  );
  group.add(earth);
  loadEarthNightTexture(earthMaterial, renderer);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.08, 96, 96),
    new THREE.MeshBasicMaterial({
      color: 0x6fa8ff,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    })
  );
  group.add(atmosphere);

  scene.add(new THREE.AmbientLight(0x8fb9ff, 0.5));

  const rimLight = new THREE.DirectionalLight(0xb7d4ff, 1.3);
  rimLight.position.set(-3.5, 2.4, 4.5);
  scene.add(rimLight);

  Object.assign(earthState, { scene, camera, renderer, group });
  resizeEarthGlobe();
  earthState.resizeObserver = new ResizeObserver(resizeEarthGlobe);
  earthState.resizeObserver.observe(elements.nightMapStage);
  animateEarthGlobe();
}

function createFallbackEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  const ocean = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  ocean.addColorStop(0, "#071222");
  ocean.addColorStop(0.45, "#0e223b");
  ocean.addColorStop(1, "#030812");
  context.fillStyle = ocean;
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawLandPatch(context, canvas, [
    [72, 22],
    [85, 16],
    [101, 18],
    [118, 22],
    [132, 32],
    [128, 45],
    [111, 53],
    [91, 49],
    [75, 38]
  ]);
  drawLandPatch(context, canvas, [
    [96, 6],
    [109, 8],
    [121, 15],
    [112, 23],
    [98, 20]
  ]);
  drawLandPatch(context, canvas, [
    [126, 30],
    [142, 30],
    [146, 45],
    [134, 49]
  ]);

  context.globalAlpha = 0.16;
  context.strokeStyle = "#9fb8d8";
  context.lineWidth = 1;
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * canvas.width;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * canvas.height;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.wrapS = THREE.RepeatWrapping;
  texture.offset.x = 0.539;
  return texture;
}

function loadEarthNightTexture(material, renderer) {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  loader.load(
    "https://upload.wikimedia.org/wikipedia/commons/2/2f/Solarsystemscope_texture_2k_earth_nightmap.jpg",
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.offset.x = 0.539;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      if (THREE.sRGBEncoding) {
        texture.encoding = THREE.sRGBEncoding;
      }
      material.map = texture;
      material.emissiveMap = texture;
      material.needsUpdate = true;
    }
  );
}

function drawLandPatch(context, canvas, points) {
  context.beginPath();
  points.forEach(([lng, lat], index) => {
    const x = ((lng + 180) / 360) * canvas.width;
    const y = ((90 - lat) / 180) * canvas.height;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.closePath();
  context.fillStyle = "rgba(30, 76, 63, 0.72)";
  context.fill();
  context.strokeStyle = "rgba(139, 172, 150, 0.24)";
  context.lineWidth = 4;
  context.stroke();
}

function initEarthInteraction() {
  if (!elements.nightMapStage) {
    return;
  }

  elements.nightMapStage.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".globe-pin") || event.target.closest(".night-map-controls")) {
      return;
    }

    earthState.dragging = true;
    earthState.lastX = event.clientX;
    earthState.lastY = event.clientY;
    elements.nightMapStage.classList.add("is-dragging");
    elements.nightMapStage.setPointerCapture(event.pointerId);
  });

  elements.nightMapStage.addEventListener("pointermove", (event) => {
    if (!earthState.dragging) {
      return;
    }

    const deltaX = event.clientX - earthState.lastX;
    const deltaY = event.clientY - earthState.lastY;
    earthState.rotationY += deltaX * 0.006;
    earthState.rotationX = Math.max(-0.65, Math.min(0.78, earthState.rotationX + deltaY * 0.004));
    earthState.lastX = event.clientX;
    earthState.lastY = event.clientY;
    updateEarthTransform();
  });

  const endDrag = (event) => {
    if (!earthState.dragging) {
      return;
    }

    earthState.dragging = false;
    elements.nightMapStage.classList.remove("is-dragging");
    if (elements.nightMapStage.hasPointerCapture(event.pointerId)) {
      elements.nightMapStage.releasePointerCapture(event.pointerId);
    }
  };

  elements.nightMapStage.addEventListener("pointerup", endDrag);
  elements.nightMapStage.addEventListener("pointercancel", endDrag);
  elements.nightMapStage.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoomEarth(event.deltaY < 0 ? -0.32 : 0.32);
  });
  elements.nightZoomIn?.addEventListener("click", () => zoomEarth(-0.42));
  elements.nightZoomOut?.addEventListener("click", () => zoomEarth(0.42));
  elements.nightReset?.addEventListener("click", resetEarthView);
}

function resizeEarthGlobe() {
  if (!earthState.renderer || !earthState.camera || !elements.nightMapStage) {
    return;
  }

  const rect = elements.nightMapStage.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  earthState.renderer.setSize(width, height, false);
  earthState.camera.aspect = width / height;
  earthState.camera.updateProjectionMatrix();
}

function animateEarthGlobe() {
  earthState.animationFrame = requestAnimationFrame(animateEarthGlobe);
  if (!earthState.renderer || !earthState.scene || !earthState.camera) {
    return;
  }

  if (!earthState.dragging && !activeCity && earthState.group) {
    earthState.rotationY += 0.0008;
    updateEarthTransform();
  }

  earthState.renderer.render(earthState.scene, earthState.camera);
  updateGlobePinPositions();
}

function updateEarthTransform() {
  if (!earthState.group) {
    return;
  }

  earthState.group.rotation.x = earthState.rotationX;
  earthState.group.rotation.y = earthState.rotationY;
  earthState.camera.position.z = earthState.cameraZ;
  earthState.camera.updateProjectionMatrix();
}

function zoomEarth(delta) {
  earthState.cameraZ = Math.max(3.4, Math.min(6.4, earthState.cameraZ + delta));
  updateEarthTransform();
}

function resetEarthView() {
  earthState.rotationX = 0.3;
  earthState.rotationY = 0;
  earthState.cameraZ = 5.1;
  updateEarthTransform();
}

function latLngToVector3(lat, lng, radius = 2.15) {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = ((lng - 104.2) * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(latRad) * Math.sin(lngRad),
    radius * Math.sin(latRad),
    radius * Math.cos(latRad) * Math.cos(lngRad)
  );
}

function renderGlobePins(groups) {
  if (!window.THREE || !earthState.group) {
    return;
  }

  earthState.pinData = [];

  [...groups.entries()].forEach(([city, cityRecords]) => {
    const coordinates = getCityCoordinates(city, cityRecords);

    if (!coordinates) {
      return;
    }

    const button = document.createElement("button");
    button.className = "globe-pin";
    button.type = "button";
    button.innerHTML = `<span class="pin-dot"></span><span class="pin-label"><strong>${city}</strong><small>${cityRecords.length}次</small></span>`;
    button.addEventListener("click", () => selectCity(city));
    elements.globePins.append(button);
    earthState.pinData.push({
      button,
      point: latLngToVector3(coordinates.lat, coordinates.lng)
    });
  });

  updateGlobePinPositions();
}

function updateGlobePinPositions() {
  if (!earthState.camera || !earthState.group || !elements.nightMapStage) {
    return;
  }

  const rect = elements.nightMapStage.getBoundingClientRect();
  earthState.group.updateMatrixWorld();
  earthState.pinData.forEach(({ button, point }) => {
    const worldPoint = point.clone().applyMatrix4(earthState.group.matrixWorld);
    const visible = worldPoint.z > -0.08;
    button.hidden = !visible;

    if (!visible) {
      return;
    }

    const projected = worldPoint.clone().project(earthState.camera);
    button.style.left = `${(projected.x * 0.5 + 0.5) * rect.width}px`;
    button.style.top = `${(-projected.y * 0.5 + 0.5) * rect.height}px`;
    button.style.opacity = String(Math.max(0.45, Math.min(1, worldPoint.z / 2.1)));
  });
}

function initEarthGlobe() {
  if (!elements.globeRoot || !window.Globe) {
    return;
  }

  const globe = new Globe(elements.globeRoot)
    .backgroundColor("rgba(0,0,0,0)")
    .globeImageUrl("https://upload.wikimedia.org/wikipedia/commons/2/2f/Solarsystemscope_texture_2k_earth_nightmap.jpg")
    .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
    .showAtmosphere(true)
    .atmosphereColor("#8fb9ff")
    .atmosphereAltitude(0.22)
    .htmlLat((city) => city.lat)
    .htmlLng((city) => city.lng)
    .htmlAltitude(0.035)
    .htmlElement(createGlobePinElement)
    .polygonsData([])
    .polygonAltitude(0.004)
    .polygonCapColor(() => "rgba(255, 255, 255, 0.015)")
    .polygonSideColor(() => "rgba(255, 255, 255, 0.005)")
    .polygonStrokeColor(() => "rgba(232, 203, 129, 0.34)");

  earthState.globe = globe;
  resizeEarthGlobe();
  resetEarthView();

  const controls = globe.controls();
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.28;
  controls.minDistance = 230;
  controls.maxDistance = 720;

  earthState.resizeObserver = new ResizeObserver(resizeEarthGlobe);
  earthState.resizeObserver.observe(elements.nightMapStage);

  fetch("https://cdn.jsdelivr.net/gh/vasturiano/globe.gl/example/datasets/ne_110m_admin_0_countries.geojson")
    .then((response) => response.json())
    .then((countries) => {
      globe.polygonsData(countries.features ?? []);
    })
    .catch(() => {
      globe.polygonsData([]);
    });
}

function initEarthInteraction() {
  elements.nightZoomIn?.addEventListener("click", () => zoomEarth(-0.28));
  elements.nightZoomOut?.addEventListener("click", () => zoomEarth(0.28));
  elements.nightReset?.addEventListener("click", resetEarthView);
}

function resizeEarthGlobe() {
  if (!earthState.globe || !elements.nightMapStage) {
    return;
  }

  const rect = elements.nightMapStage.getBoundingClientRect();
  earthState.globe.width(Math.max(1, Math.floor(rect.width)));
  earthState.globe.height(Math.max(1, Math.floor(rect.height)));
}

function resetEarthView() {
  if (!earthState.globe) {
    return;
  }

  earthState.globe.pointOfView({ lat: 32, lng: 104, altitude: 1.72 }, 800);
  const controls = earthState.globe.controls();
  if (controls) {
    controls.autoRotate = true;
  }
}

function zoomEarth(delta) {
  if (!earthState.globe) {
    return;
  }

  const pov = earthState.globe.pointOfView();
  earthState.globe.pointOfView(
    {
      lat: pov.lat,
      lng: pov.lng,
      altitude: Math.max(0.85, Math.min(2.7, pov.altitude + delta))
    },
    350
  );
}

function createGlobePinElement(city) {
  const button = document.createElement("button");
  button.className = "globe-pin";
  button.type = "button";
  button.innerHTML = `<span class="pin-dot"></span><span class="pin-label"><strong>${city.city}</strong><small>${city.count}次</small></span>`;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    selectCity(city.city);
  });
  return button;
}

function renderGlobePins(groups) {
  if (!earthState.globe) {
    return;
  }

  const cities = [...groups.entries()]
    .map(([city, cityRecords]) => {
      const coordinates = getCityCoordinates(city, cityRecords);
      if (!coordinates) {
        return null;
      }

      return {
        city,
        count: cityRecords.length,
        lat: coordinates.lat,
        lng: coordinates.lng
      };
    })
    .filter(Boolean);

  earthState.globe.htmlElementsData(cities);
}

function renderPlaceMarkers(cityRecords) {
  cityRecords.forEach((record) => {
    const stayCoordinates = getStayCoordinates(record);

    if (stayCoordinates) {
      const stayPoint = new BMapGL.Point(stayCoordinates.lng, stayCoordinates.lat);
      addMapMarker(stayPoint, `住处：${record.stay}`, "stay", () => {
        selectRecord(record.id, stayCoordinates);
      });
    }

    const places = getRecordPlaces(record);

    if (places.length === 0) {
      const coordinates = getCoordinates(record);

      if (!coordinates) {
        return;
      }

      const point = new BMapGL.Point(coordinates.lng, coordinates.lat);
      addMapMarker(point, formatDateRange(record), "place", () => selectRecord(record.id));
      return;
    }

    places.forEach((place) => {
      if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
        return;
      }

      const point = new BMapGL.Point(place.longitude, place.latitude);
      addMapMarker(point, place.name, "place", () => selectRecord(record.id, { lat: place.latitude, lng: place.longitude }));
    });
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
}

function focusMapOnCoordinates(coordinates, zoom = 15) {
  if (!mapState.ready || !coordinates) {
    return;
  }

  const point = new BMapGL.Point(coordinates.lng, coordinates.lat);
  mapState.map.centerAndZoom(point, Math.max(mapState.map.getZoom(), zoom));
}

function focusMapOnCity(city, shouldZoom = true) {
  const groups = groupRecordsByCity();
  const cityRecords = groups.get(city);

  if (!mapState.ready || !cityRecords) {
    return;
  }

  const coordinates = getCityCoordinates(city, cityRecords);
  if (!coordinates) {
    return;
  }

  const point = new BMapGL.Point(coordinates.lng, coordinates.lat);
  const targetZoom = shouldZoom ? Math.max(mapState.map.getZoom(), 11) : Math.max(mapState.map.getZoom(), 5);
  mapState.map.centerAndZoom(point, targetZoom);
}

function showCountryMap() {
  activeCity = null;
  render();

  if (!mapState.ready) {
    return;
  }

  mapState.map.centerAndZoom(new BMapGL.Point(104.1954, 35.8617), 4);
}

function renderTimeline(ordered) {
  elements.timeline.innerHTML = "";

  ordered.forEach((record) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = record.id === activeId ? "active" : "";
    button.type = "button";
    button.innerHTML = `<strong>${formatDateRange(record)}</strong><span>${formatPlace(record)}</span>`;
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
    elements.detailNote.textContent = "点击“新增记录”，把你们下一次见面写进地图。";
    elements.dailyEvents.innerHTML = "";
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
  elements.detailNote.textContent = record.note;
  renderDailyEvents(record);
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

function renderDailyEvents(record) {
  const events = record.dailyEvents ?? [];
  elements.dailyEvents.innerHTML = "";

  if (events.length === 0) {
    const empty = document.createElement("p");
    empty.className = "daily-empty";
    empty.textContent = "这次还没有按天记录，可以编辑后补上吃了什么、去了哪里。";
    elements.dailyEvents.append(empty);
    return;
  }

  events.map(normalizeDailyEvent).forEach((event) => {
    const item = document.createElement("article");
    const date = document.createElement("strong");
    const text = document.createElement("p");
    item.className = "daily-event";
    date.textContent = event.date ? formatDate(event.date) : "某一天";
    text.textContent = event.text;
    item.append(date, text);
    elements.dailyEvents.append(item);
  });
}

function selectRecord(id, focusCoordinates = null) {
  activeId = id;
  activeCity = records.find((record) => record.id === id)?.city ?? activeCity;
  render();
  if (focusCoordinates) {
    focusMapOnCoordinates(focusCoordinates);
    return;
  }

  focusMapOnRecord(records.find((record) => record.id === id));
}

function selectCity(city) {
  const groups = groupRecordsByCity();
  const cityRecords = groups.get(city) ?? [];
  activeCity = city;
  activeId = cityRecords[0]?.id ?? null;
  render();
  focusMapOnCity(city);
}

function createPlaceRow(place = {}) {
  const row = document.createElement("div");
  const input = document.createElement("input");
  const actions = document.createElement("div");
  const searchButton = document.createElement("button");
  const removeButton = document.createElement("button");
  const selected = document.createElement("span");
  const results = document.createElement("div");

  row.className = "place-row";
  row.dataset.latitude = Number.isFinite(place.latitude) ? String(place.latitude) : "";
  row.dataset.longitude = Number.isFinite(place.longitude) ? String(place.longitude) : "";

  input.className = "place-input";
  input.placeholder = "例如：北京798艺术中心、北京南站";
  input.value = place.name || "";

  actions.className = "place-search-actions";
  searchButton.className = "ghost-button search-place";
  searchButton.type = "button";
  searchButton.textContent = "搜索地点";
  removeButton.className = "ghost-button remove-place";
  removeButton.type = "button";
  removeButton.textContent = "删除";
  selected.className = "selected-place";
  selected.textContent = place.name ? `已填写：${place.name}` : "未选择地图地点";
  results.className = "place-results";
  results.setAttribute("aria-live", "polite");

  actions.append(searchButton, removeButton, selected);
  row.append(input, actions, results);
  return row;
}

function addPlaceRow(place = {}) {
  elements.placesList.append(createPlaceRow(place));
}

function renderPlaceRows(places = []) {
  elements.placesList.innerHTML = "";
  const rows = places.length > 0 ? places : [{}];
  rows.forEach(addPlaceRow);
}

function getPlaceRows() {
  return [...elements.placesList.querySelectorAll(".place-row")];
}

function readPlaceRows() {
  return getPlaceRows()
    .map((row) => ({
      name: row.querySelector(".place-input").value.trim(),
      latitude: row.dataset.latitude ? Number(row.dataset.latitude) : null,
      longitude: row.dataset.longitude ? Number(row.dataset.longitude) : null
    }))
    .filter((place) => place.name);
}

function clearPlaceSelections() {
  getPlaceRows().forEach((row) => {
    row.dataset.latitude = "";
    row.dataset.longitude = "";
    row.querySelector(".selected-place").textContent = "未选择地图地点";
    row.querySelector(".place-results").innerHTML = "";
  });
}

function openDialog(record = null) {
  elements.form.reset();
  clearSelectedCity();
  clearSelectedStay();
  renderPlaceRows();
  renderDailyEventRows();
  editingId = record?.id ?? null;
  document.querySelector("#dialog-title").textContent = editingId ? "编辑见面记录" : "新增见面记录";
  elements.form.querySelector('button[type="submit"]').textContent = editingId ? "保存修改" : "保存记录";

  if (record) {
    formFields.city.value = record.city;
    if (hasPreciseCoordinates(record)) {
      selectedCity = {
        title: record.city,
        address: "",
        latitude: record.latitude,
        longitude: record.longitude
      };
      elements.selectedCity.textContent = `已选择：${selectedCity.title}`;
    }
    renderPlaceRows(getRecordPlaces(record));
    formFields.startDate.value = record.startDate;
    formFields.endDate.value = record.endDate || "";
    formFields.stay.value = record.stay;
    if (hasStayCoordinates(record)) {
      selectedStay = {
        title: record.stay,
        latitude: record.stayLatitude,
        longitude: record.stayLongitude
      };
      elements.selectedStay.textContent = `已选择：${record.stay}`;
    }
    formFields.note.value = record.note;
    renderDailyEventRows(record.dailyEvents ?? []);
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

function clearSelectedStay() {
  selectedStay = null;
  elements.selectedStay.textContent = "未选择地图住处";
  elements.stayResults.innerHTML = "";
}

async function handleCitySearch() {
  const keyword = formFields.city.value.trim();

  clearSelectedCity();
  clearSelectedStay();
  clearPlaceSelections();

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

async function handlePlaceSearch(event) {
  const row = event.target.closest(".place-row");
  const city = getSearchCity();
  const keyword = row?.querySelector(".place-input").value.trim();
  const results = row?.querySelector(".place-results");

  if (!row || !results) {
    return;
  }

  results.innerHTML = "";

  if (!mapState.ready) {
    results.textContent = "地图还没加载好，请稍后再试。";
    return;
  }

  if (!keyword) {
    results.textContent = "先输入一个具体地点，比如“北京南站”。";
    return;
  }

  results.textContent = "正在搜索...";

  try {
    const candidates = await searchPlaceCandidates(city, keyword);
    renderPlaceCandidates(candidates, row);
  } catch {
    results.textContent = "没有找到地点。可以换一个更完整的名称，比如“北京南站”。";
  }
}

function renderPlaceCandidates(candidates, row) {
  const results = row.querySelector(".place-results");
  results.innerHTML = "";

  candidates.forEach((candidate) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "place-result";
    button.innerHTML = `<strong>${candidate.title}</strong><span>${candidate.address || "百度地图搜索结果"}</span>`;
    button.addEventListener("click", () => {
      row.dataset.latitude = String(candidate.latitude);
      row.dataset.longitude = String(candidate.longitude);
      row.querySelector(".place-input").value = candidate.title;
      row.querySelector(".selected-place").textContent = `已选择：${candidate.title}`;
      results.innerHTML = "";
    });
    results.append(button);
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
      formFields.city.value = candidate.title;
      elements.selectedCity.textContent = `已选择：${candidate.title}`;
      elements.cityResults.innerHTML = "";
      clearSelectedStay();
      clearPlaceSelections();
    });
    elements.cityResults.append(button);
  });
}

function handleCityInputChange() {
  if (selectedCity && formFields.city.value.trim() !== selectedCity.title) {
    clearSelectedCity();
    clearSelectedStay();
    clearPlaceSelections();
  }
}

async function handleStaySearch() {
  const city = getSearchCity();
  const keyword = formFields.stay.value.trim();

  clearSelectedStay();

  if (!mapState.ready) {
    elements.stayResults.textContent = "地图还没加载好，请稍后再试。";
    return;
  }

  if (!keyword) {
    elements.stayResults.textContent = "先输入住处，比如“北京三里屯酒店”。";
    return;
  }

  elements.stayResults.textContent = "正在搜索...";

  try {
    const candidates = await searchPlaceCandidates(city, keyword);
    renderStayCandidates(candidates);
  } catch {
    elements.stayResults.textContent = "没有找到住处。可以换一个更完整的名称，比如“北京三里屯酒店”。";
  }
}

function renderStayCandidates(candidates) {
  elements.stayResults.innerHTML = "";

  candidates.forEach((candidate) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "place-result";
    button.innerHTML = `<strong>${candidate.title}</strong><span>${candidate.address || "百度地图搜索结果"}</span>`;
    button.addEventListener("click", () => {
      selectedStay = candidate;
      formFields.stay.value = candidate.title;
      elements.selectedStay.textContent = `已选择：${candidate.title}`;
      elements.stayResults.innerHTML = "";
    });
    elements.stayResults.append(button);
  });
}

function handleStayInputChange() {
  if (selectedStay && formFields.stay.value.trim() !== selectedStay.title) {
    clearSelectedStay();
  }
}

function handlePlacesListInput(event) {
  if (event.target.classList.contains("place-input")) {
    const row = event.target.closest(".place-row");
    row.dataset.latitude = "";
    row.dataset.longitude = "";
    row.querySelector(".selected-place").textContent = "未选择地图地点";
    row.querySelector(".place-results").innerHTML = "";
  }
}

function handlePlacesListClick(event) {
  const row = event.target.closest(".place-row");

  if (!row) {
    return;
  }

  if (event.target.classList.contains("search-place")) {
    handlePlaceSearch(event);
    return;
  }

  if (event.target.classList.contains("remove-place")) {
    row.remove();

    if (getPlaceRows().length === 0) {
      addPlaceRow();
    }
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
    const places = readPlaceRows();
    const primaryPlace = places[0];
    const stay = formData.get("stay").trim();
    const canReuseStayCoordinates = originalRecord?.stay === stay;
    const record = {
      id: recordId,
      city: selectedCity?.title || formData.get("city").trim(),
      placeName: primaryPlace?.name || "",
      latitude: primaryPlace?.latitude ?? null,
      longitude: primaryPlace?.longitude ?? null,
      places,
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      stay,
      stayLatitude: selectedStay?.latitude ?? (canReuseStayCoordinates ? originalRecord?.stayLatitude : null) ?? null,
      stayLongitude: selectedStay?.longitude ?? (canReuseStayCoordinates ? originalRecord?.stayLongitude : null) ?? null,
      scene: originalRecord?.scene || "",
      note: formData.get("note").trim(),
      dailyEvents: readDailyEventRows(),
      photos: originalRecord?.photos ?? []
    };

    try {
      record.places = await resolveRecordPlaces(record);
      const stayLocation = await resolveStayLocation(record);
      record.stayLatitude = stayLocation.latitude;
      record.stayLongitude = stayLocation.longitude;
    } catch {
      throw new Error("没有定位到这个城市、地点或住处，请换一个更完整的名称。");
    }

    const located = record.places[0];
    record.latitude = located?.latitude ?? null;
    record.longitude = located?.longitude ?? null;
    record.placeName = located?.name || record.placeName || record.city;

    if (cloudEnabled) {
      try {
        record.photos = [
          ...record.photos,
          ...(await uploadPhotos(record.id, formFields.photos.files))
        ];
      } catch {
        throw new Error("照片上传失败，请稍后再试，或先不选照片保存。");
      }

      const request = editingId
        ? cloud.from(tableName).update(toCloudRecord(record)).eq("id", record.id)
        : cloud.from(tableName).insert(toCloudRecord(record));
      const { error } = await request;

      if (error) {
        throw new Error(formatCloudError(error));
      }

      activeId = record.id;
      activeCity = record.city;
      closeDialog();
      await loadCloudRecords();
    } else {
      record.photos = [
        ...record.photos,
        ...(await readPhotosAsDataUrls(formFields.photos.files))
      ];
      records = editingId
        ? records.map((item) => (item.id === record.id ? record : item))
        : [...records, record];
      activeId = record.id;
      activeCity = record.city;
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

function formatCloudError(error) {
  const message = error.message || error.details || "";

  if (
    message.includes("latitude") ||
    message.includes("longitude") ||
    message.includes("place_name") ||
    message.includes("places") ||
    message.includes("stay_latitude") ||
    message.includes("stay_longitude") ||
    message.includes("daily_events")
  ) {
    return "云端数据库还没升级：请在 Supabase SQL Editor 运行新增字段的 SQL。";
  }

  return `云端保存失败：${message || "请检查 Supabase 表字段和权限"}`;
}

async function resetDemoRecords() {
  records = demoRecords;
  activeId = records[0].id;
  activeCity = null;

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

  const confirmed = confirm(`确定删除「${formatPlace(record)}」这条记录吗？`);

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

elements.openForm.addEventListener("click", () => openDialog());
elements.editRecord.addEventListener("click", openEditDialog);
elements.deleteRecord.addEventListener("click", deleteActiveRecord);
elements.showCountry.addEventListener("click", showCountryMap);
elements.searchCity.addEventListener("click", handleCitySearch);
elements.searchStay.addEventListener("click", handleStaySearch);
formFields.city.addEventListener("input", handleCityInputChange);
formFields.stay.addEventListener("input", handleStayInputChange);
formFields.startDate.addEventListener("change", syncDailyEventDateBounds);
formFields.endDate.addEventListener("change", syncDailyEventDateBounds);
elements.addPlace.addEventListener("click", () => addPlaceRow());
elements.placesList.addEventListener("input", handlePlacesListInput);
elements.placesList.addEventListener("click", handlePlacesListClick);
elements.addDailyEvent.addEventListener("click", () => addDailyEventRow());
elements.dailyEventsList.addEventListener("click", handleDailyEventsListClick);
elements.closeForm.addEventListener("click", closeDialog);
elements.cancelForm.addEventListener("click", closeDialog);
elements.resetDemo.addEventListener("click", resetDemoRecords);
elements.form.addEventListener("submit", handleSubmit);
