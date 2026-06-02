import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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

const elements = {
  globeCanvas: document.querySelector("#globe-canvas"),
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
let globe = null;

init();

function initGlobe() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pins = new Map();
  const radius = 2;

  camera.position.set(0, 0.45, 6.4);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = "globe-renderer";
  elements.globeCanvas.prepend(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 3.2;
  controls.maxDistance = 9;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.75;

  scene.add(new THREE.AmbientLight(0xffffff, 1.35));

  const sunlight = new THREE.DirectionalLight(0xffffff, 2.4);
  sunlight.position.set(3, 2, 4);
  scene.add(sunlight);

  const earthTexture = new THREE.TextureLoader().load(
    "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
  );
  const bumpTexture = new THREE.TextureLoader().load(
    "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
  );
  const cloudTexture = new THREE.TextureLoader().load(
    "https://cdn.jsdelivr.net/npm/three-globe/example/img/fair_clouds_4k.png"
  );
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  bumpTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  cloudTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 96, 96),
    new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.035,
      roughness: 0.78,
      metalness: 0.08
    })
  );
  scene.add(earth);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.012, 96, 96),
    new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.32,
      roughness: 0.82
    })
  );
  scene.add(clouds);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.035, 96, 96),
    new THREE.MeshBasicMaterial({
      color: 0x8cc7ff,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide
    })
  );
  scene.add(atmosphere);

  const stars = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(createStars(), 3)
    ),
    new THREE.PointsMaterial({ color: 0xffffff, opacity: 0.45, size: 0.018, transparent: true })
  );
  scene.add(stars);

  function resize() {
    const { width, height } = elements.globeCanvas.getBoundingClientRect();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    controls.update();
    stars.rotation.y += 0.00045;
    clouds.rotation.y += 0.00022;
    updateMarkerLabels(camera, pins);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  renderer.domElement.addEventListener("click", (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(pointer, camera);

    const hit = raycaster.intersectObjects([...pins.values()].map((pin) => pin.mesh))[0];
    if (hit?.object.userData.recordId) {
      selectRecord(hit.object.userData.recordId);
    }
  });

  window.addEventListener("resize", resize);
  resize();
  animate();

  globe = { scene, camera, earth, pins, radius };
}

async function init() {
  initGlobe();
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
  const coordinates = getCoordinates(record);
  const place = record.placeName || record.city;
  return `${place} · ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
}

function getCoordinates(record) {
  if (Number.isFinite(record.latitude) && Number.isFinite(record.longitude)) {
    return { lat: record.latitude, lng: record.longitude };
  }

  if (cityPositions[record.city]) {
    return cityPositions[record.city];
  }

  let total = 0;
  for (const char of record.city) {
    total += char.charCodeAt(0);
  }

  return {
    lat: 16 + (total % 34),
    lng: 85 + ((total * 11) % 55)
  };
}

function latLngToVector3(lat, lng, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);

  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createStars() {
  const vertices = [];

  for (let index = 0; index < 850; index += 1) {
    const distance = 18 + Math.random() * 18;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    vertices.push(
      distance * Math.sin(phi) * Math.cos(theta),
      distance * Math.sin(phi) * Math.sin(theta),
      distance * Math.cos(phi)
    );
  }

  return vertices;
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
  clearGlobePins();

  ordered.forEach((record, index) => {
    const coordinates = getCoordinates(record);
    const button = document.createElement("button");
    button.className = `map-marker${record.id === activeId ? " active" : ""}`;
    button.hidden = true;
    button.dataset.city = record.placeName || record.city;
    button.type = "button";
    button.ariaLabel = `查看${record.placeName || record.city}的见面记录`;
    button.textContent = String(index + 1).padStart(2, "0");
    button.addEventListener("click", () => selectRecord(record.id));
    elements.markerLayer.append(button);
    addGlobePin(record, index, coordinates, button);
  });
}

function clearGlobePins() {
  if (!globe) {
    return;
  }

  globe.pins.forEach((pin) => {
    globe.earth.remove(pin.group);
    pin.group.children.forEach((child) => {
      child.geometry.dispose();
      child.material.dispose();
    });
  });
  globe.pins.clear();
}

function addGlobePin(record, index, coordinates, label) {
  if (!globe) {
    return;
  }

  const position = latLngToVector3(coordinates.lat, coordinates.lng, globe.radius + 0.04);
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(record.id === activeId ? 0.045 : 0.03, 24, 24),
    new THREE.MeshStandardMaterial({
      color: record.id === activeId ? 0xf7d77a : 0xf4f0e7,
      emissive: record.id === activeId ? 0xb87912 : 0x6a82a8,
      emissiveIntensity: record.id === activeId ? 0.72 : 0.44,
      roughness: 0.25
    })
  );
  marker.position.copy(position);
  marker.userData.recordId = record.id;

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.16, 12),
    new THREE.MeshStandardMaterial({ color: 0xdce7f7, roughness: 0.35 })
  );
  stem.position.copy(latLngToVector3(coordinates.lat, coordinates.lng, globe.radius + 0.015));
  stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), stem.position.clone().normalize());

  const group = new THREE.Group();
  group.add(stem);
  group.add(marker);
  globe.earth.add(group);
  globe.pins.set(record.id, { mesh: marker, group, label, position, index });
}

function updateMarkerLabels(camera, pins) {
  if (!globe) {
    return;
  }

  const width = elements.globeCanvas.clientWidth;
  const height = elements.globeCanvas.clientHeight;

  pins.forEach((pin, recordId) => {
    const worldPosition = new THREE.Vector3();
    pin.mesh.getWorldPosition(worldPosition);

    const cameraDirection = worldPosition.clone().sub(camera.position).normalize();
    const surfaceNormal = worldPosition.clone().normalize();
    const isVisible = cameraDirection.dot(surfaceNormal) < -0.2;
    const projected = worldPosition.clone().project(camera);

    pin.label.hidden = !isVisible;
    pin.label.classList.toggle("active", recordId === activeId);
    pin.label.style.left = `${((projected.x + 1) / 2) * width}px`;
    pin.label.style.top = `${((-projected.y + 1) / 2) * height}px`;
  });
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
    elements.detailCity.textContent = "还没有记录";
    elements.detailTime.textContent = "-";
    elements.detailPlace.textContent = "-";
    elements.detailStay.textContent = "-";
    elements.detailScene.textContent = "-";
    elements.detailNote.textContent = "点击“新增记录”，把你们下一次见面写进地图。";
    elements.photoGrid.innerHTML = "";
    return;
  }

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
}

function openDialog() {
  elements.form.reset();
  elements.dialog.showModal();
}

function closeDialog() {
  elements.dialog.close();
}

function fillCityCoordinates() {
  const city = elements.form.city.value.trim();
  const coordinates = cityPositions[city];

  if (!coordinates) {
    return;
  }

  if (!elements.form.latitude.value) {
    elements.form.latitude.value = coordinates.lat;
  }

  if (!elements.form.longitude.value) {
    elements.form.longitude.value = coordinates.lng;
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

  const submitButton = elements.form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "保存中...";

  try {
    const formData = new FormData(elements.form);
    const latitude = Number.parseFloat(formData.get("latitude"));
    const longitude = Number.parseFloat(formData.get("longitude"));
    const record = {
      id: `record-${Date.now()}`,
      city: formData.get("city").trim(),
      placeName: formData.get("placeName").trim(),
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
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
elements.form.city.addEventListener("change", fillCityCoordinates);
elements.form.city.addEventListener("blur", fillCityCoordinates);
elements.form.addEventListener("submit", handleSubmit);
