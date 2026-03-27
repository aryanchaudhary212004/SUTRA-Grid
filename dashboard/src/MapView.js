import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle, Polyline } from "react-leaflet";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";

const getZoneLabel = (index) => {
  return `Zone ${String.fromCharCode(65 + index)}`;
};



/* ---------------- ICONS ---------------- */

const normalIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const testIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [22, 22]
});
 
const warningIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    background: #ff2d2d;
    color: white;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    border: 3px solid white;
    box-shadow: 0 0 10px rgba(255,0,0,0.8);
    animation: pulse 0.7s infinite alternate;
  ">⚠️</div>`,
  iconSize: [20, 20],
  iconAnchor: [18, 18]
});
 
/* ─────────────── CLUSTER LAYER ─────────────── */
 
function ClusterLayer({ vehicles, simulationMode }) {
  const map = useMap();
 
  useEffect(() => {
    const markers = L.markerClusterGroup();
 
    vehicles.forEach(v => {
      if (!v.lat || !v.lng) return;
 
      const isAmb = v.vehicle_id && v.vehicle_id.includes("AMB");
 
      const marker = L.marker([v.lat, v.lng], {
  icon: isAmb
    ? ambulanceIcon
    : simulationMode
      ? new L.Icon({
          iconUrl:"https://maps.google.com/mapfiles/ms/icons/purple-dot.png",
          iconSize:[16, 16]
        })
      : normalIcon,
  draggable:true
});
 
      marker.bindPopup(`
        <b>${isAmb ? "🚑 AMBULANCE" : "🚗 Vehicle"}</b><br/>
        <b>ID:</b> ${v.vehicle_id}<br/>
        <b>Speed:</b> ${v.speed} km/h<br/>
        <b>Direction:</b> ${v.direction}
      `);
 
      markers.addLayer(marker);
    });
 
    map.addLayer(markers);
    return () => map.removeLayer(markers);

  }, [vehicles, map]);

  return null;
}
 
/* ─────────────── HEATMAP ─────────────── */
 
function HeatmapLayer({ vehicles }) {
  const map = useMap();
 
  useEffect(() => {

    if (!vehicles || vehicles.length === 0) return;

    const heatPoints = vehicles
      .filter(v => v.lat && v.lng)
      .map(v => [v.lat, v.lng, (v.speed || 10) / 100]);

    if (heatPoints.length === 0) return;
 
    const heat = L.heatLayer(heatPoints, {
  radius: 18,
  blur: 10,
  maxZoom: 17
});
    map.addLayer(heat);
 
    return () => map.removeLayer(heat);
  }, [vehicles, map]);
 
  return null;
}

/* ---------------- TRAFFIC LIGHT PANEL ---------------- */

function TrafficLight({ signalData }) {
  const [currentLight, setCurrentLight] = useState("green");
  const [timeLeft, setTimeLeft] = useState(0);
 
  useEffect(() => {
    if (!signalData) return;

    const { greenSignalDuration, redSignalDuration, yellowSignalDuration } = signalData;

    const cycle = [
      { light: "green", duration: greenSignalDuration },
      { light: "yellow", duration: yellowSignalDuration },
      { light: "red", duration: redSignalDuration },
      { light: "yellow", duration: yellowSignalDuration },
    ];
 
    let index = 0;
    let remaining = cycle[0].duration;
    setCurrentLight(cycle[0].light);
    setTimeLeft(remaining);
 
    const timer = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
 
      if (remaining <= 0) {
        index = (index + 1) % cycle.length;
        remaining = cycle[index].duration;
        setCurrentLight(cycle[index].light);
        setTimeLeft(remaining);
      }
    }, 1000);
 
    return () => clearInterval(timer);
  }, [signalData]);
 
  if (!signalData) return null;

  const { density, greenSignalDuration, redSignalDuration, trafficLevel } = signalData;

  return (
    <div style={{
  background: "rgba(255,255,255,0.95)",
  padding: "12px",
  borderRadius: "12px",
  width: "240px",
  marginBottom: "10px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
}}>
      <h4>🚦 Traffic Signal</h4>

      <div style={{
        background: "#111", padding: 12, borderRadius: 10,
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 8
      }}>

        {["red", "yellow", "green"].map((c) => (

          <div key={c}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background:
                currentLight === c
                  ? (c === "red" ? "#e74c3c" : c === "yellow" ? "#f1c40f" : "#2ecc71")
                  : "#555"
            }}
          />

        ))}

        <div style={{ color: "white", fontSize: "18px", fontWeight: "bold" }}>
          {timeLeft}s
        </div>

      </div>

      <div style={{ marginTop: "10px", fontSize: "12px" }}>
        🚗 Vehicles: {density} <br/>
        🟢 Green: {greenSignalDuration}s <br/>
        🔴 Red: {redSignalDuration}s <br/>
        📊 Level: {trafficLevel}
      </div>
    </div>
  );
}

/* ---------------- MAIN MAP VIEW ---------------- */

function MapView() {
  

  const mapRef = useRef(null);
  const [vehicles, setVehicles] = useState([]);
  const [zones, setZones] = useState([]);
  const [signalData, setSignalData] = useState(null);
  const [collisions, setCollisions] = useState([]);
  const [realRoute, setRealRoute] = useState([]);
  const [movingVehicles, setMovingVehicles] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const socketRef = useRef(null);
  const emergencyVehicles = vehicles.filter(v => v.isEmergency);
  const route = emergencyVehicles
  .filter(v => v.lat && v.lng)
  .sort((a, b) => {
    const distA = Math.abs(a.lat - 28.6762) + Math.abs(a.lng - 77.3211);
    const distB = Math.abs(b.lat - 28.6762) + Math.abs(b.lng - 77.3211);
    return distA - distB;
  })
  .slice(0, 8)
  .map(v => [v.lat, v.lng]);

  const chartData = zones.slice(0, 10).map((z, i) => ({
  zone: getZoneLabel(i).slice(0, 8),
  density: z.density
  }));

  {emergencyVehicles.length > 0 && (
  <Polyline
    positions={emergencyVehicles.map(v => [v.lat, v.lng])}
    pathOptions={{ color: "lime", weight: 5 }}
    
  />
)}

useEffect(() => {
  if (!realRoute.length) return;

  // create 10 vehicles at different positions
  const initialVehicles = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    index: i * 5, // spread across route
  }));

  setMovingVehicles(initialVehicles);

}, [realRoute]);

useEffect(() => {
  if (!realRoute.length) return;

  const interval = setInterval(() => {

    setMovingVehicles(prev =>
      prev.map(v => ({
        ...v,
        index: (v.index + 1) % realRoute.length // move forward
      }))
    );

  }, 500); // speed

  return () => clearInterval(interval);

}, [realRoute]);



useEffect(() => {

  const fetchRoute = async () => {
    try {
      const emergency = vehicles.find(v => v.isEmergency);
      const target = vehicles[0];

      if (!emergency || !target) return;

      const res = await axios.get(
        `http://localhost:5000/api/traffic/real-route?startLat=${emergency.lat}&startLng=${emergency.lng}&endLat=${target.lat}&endLng=${target.lng}`
      );

      setRealRoute(res.data.route || []);

    } catch (err) {
      console.error("Route error:", err.message);
    }
  };
  

  fetchRoute();

  const interval = setInterval(fetchRoute, 5000);

  return () => clearInterval(interval);

}, [vehicles]);

  // Collision Risk Warnings
  useEffect(() => {

  const fetchCollisions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/traffic/collision-risk");
      setCollisions(res.data.warnings || []);
    } catch (err) {
      console.error(err.message);
    }
  };

  fetchCollisions();
  const interval = setInterval(fetchCollisions, 3000);

  return () => clearInterval(interval);

}, []);
  // Socket.IO connection for real-time updates
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");
    socketRef.current.on("traffic-update", (zonesData) => {
      setZones(zonesData);
    });

    socketRef.current.on("vehicle-update", (newVehicle) => {
      setVehicles(prev => [newVehicle, ...prev.slice(0, 80)]);
    });

    return () => socketRef.current.disconnect();
  }, []);

  /* FETCH VEHICLES + TRAFFIC */
useEffect(() => {

  const fetchTraffic = async () => {
  const res = await axios.get("http://localhost:5000/api/traffic/traffic-analysis");
  setZones(res.data.congestionZones);
};

    fetchVehicles();
    fetchTraffic();

    const interval = setInterval(() => {
      fetchVehicles();
      fetchTraffic();
    }, 3000);

    return () => clearInterval(interval);

  }, []);

  /* ---------- SIGNAL DATA ---------- */

  useEffect(() => {

  const fetchSignal = async () => {
  const res = await axios.get("http://localhost:5000/api/traffic/signal-decision");
  setSignalData(res.data);
};

    fetchSignal();

}, [selectedZone]);



  const btnStyle = {
  background: "#1e293b",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "5px 10px",
  cursor: "pointer",
  fontSize: "16px"
};
  return (
    <>

    {/* 🔥 TOP STATUS BAR */}
    <div style={{
  position: "fixed",
  top: "10px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 3000,

  background: "#0f172a",
  color: "white",

  padding: "12px 22px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 6px 20px rgba(0,0,0,0.3)",

  display: "flex",
  gap: "25px",
  fontSize: "14px",
  fontWeight: "600"
}}>

  <span>🚗 {vehicles.length} Vehicles</span>
  <span>🚦 {zones.length} Zones</span>
  <span>
    🚑 {vehicles.some(v => v.isEmergency) ? "Emergency ACTIVE" : "No Emergency"}
  </span>

  {/* 🔥 ZOOM BUTTONS */}
  <button onClick={() => mapRef.current?.zoomIn()}
    style={btnStyle}>+</button>

  <button onClick={() => mapRef.current?.zoomOut()}
    style={btnStyle}>-</button>

</div>
      <MapContainer
  center={[28.6762, 77.3211]}
  zoom={13}
  zoomControl={false}
  whenCreated={(map) => (mapRef.current = map)}  // 🔥 important
  style={{ height: "100vh", width: "100%" }}
>
        {route.length > 0 && (
 <Polyline
  positions={route}
  pathOptions={{
    color: "lime",
    weight: 5,
    dashArray: "8,8"   // 🔥 add this
  }}
/>
)}

        {collisions
          .filter(c => c.risk === "HIGH" || c.risk === "CRITICAL")
          .slice(0, 10)
          .map((c, i) => (
  <Circle
    key={i}
    center={[c.lat, c.lng]}
    radius={30}
    pathOptions={{
      color: c.risk === "CRITICAL" ? "red" : "orange"
    }}
  />
))}

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

  <ClusterLayer vehicles={vehicles} />
  <HeatmapLayer vehicles={vehicles} />

        {realRoute.length > 0 && (
  <Polyline
    positions={realRoute}
    pathOptions={{
      color: "blue",
      weight: 6
    }}
  />
)}

        {zones.slice(0, 10).map((z, i) => {
          const [lat, lng] = z.zone.split("-").map(Number);

          return (
            <Marker
  position={[lat, lng]}
  eventHandlers={{
    click: () => setSelectedZone(z)
  }}
  icon={
    selectedZone?.zone === z.zone
      ? highlightedIcon
      : normalIcon
  }
>
            </Marker>
          );
        })}
        

  </MapContainer>



<div style={{
  position: "fixed",
  top: "10px",
  left: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  zIndex: 3000,
  marginTop: "20px"
}}>
  {selectedZone && (
  <TrafficLight signalData={signalData} />
)}

  {/* 💥 Collision Alerts */}
  <div style={{
    background: "white",
    padding: "12px",
    borderRadius: "12px",
    width: "240px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
  }}>
    <h4>💥 Collision Alerts</h4>

    {collisions.slice(0, 5).map((c, i) => (
      <div key={i} style={{ fontSize: "13px" }}>
        {c.risk} - {c.combinedSpeed}
      </div>
    ))}
  </div>

  {/* 📊 Traffic Density */}
  <div style={{
    background: "white",
    padding: "12px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
  }}>
    <h4>📊 Traffic Density</h4>

    <BarChart width={240} height={140} data={chartData}>
      <XAxis dataKey="zone" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="density" />
    </BarChart>
  </div>

</div>

      <div style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 2000,
        background: "white",
        padding: "18px",
        borderRadius: "14px",
        width: "260px",
        boxShadow: "0 6px 25px rgba(0,0,0,0.25)",
        fontFamily: "Inter, Arial",
        maxHeight: "80vh",
        overflowY: "auto"
      }}>
      <h3 style={{marginTop:0}}>🚦 Signal Decisions</h3>

      {zones.map((z, i) => (
        <div key={i} style={{ marginBottom: "8px" }}>
          <b>Zone:</b> {z.zone} <br/>
          Density: {z.density} <br/>
          Green Time: {z.greenTime}s
        </div>
      ))}
    </div>

    </>
  );
}

export default MapView;