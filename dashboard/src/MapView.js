import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.heat";
 
/* ─────────────── ICONS ─────────────── */
 
const normalIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
 
const ambulanceIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [35, 35]
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
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});
 
/* ─────────────── CLUSTER LAYER ─────────────── */
 
function ClusterLayer({ vehicles }) {
  const map = useMap();
 
  useEffect(() => {
    if (!Array.isArray(vehicles) || vehicles.length === 0) return;
 
    const markers = L.markerClusterGroup();
 
    vehicles.forEach(v => {
      if (!v.lat || !v.lng) return;
 
      const isAmb = v.vehicle_id && v.vehicle_id.includes("AMB");
 
      const marker = L.marker([v.lat, v.lng], {
        icon: isAmb ? ambulanceIcon : normalIcon,
        draggable: true 
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
    if (!Array.isArray(vehicles) || vehicles.length === 0) return;
 
    const heatPoints = vehicles
      .filter(v => v.lat && v.lng)
      .map(v => [v.lat, v.lng, (v.speed || 10) / 100]);
 
    if (heatPoints.length === 0) return;
 
    const heat = L.heatLayer(heatPoints, { radius: 25, blur: 15 });
    map.addLayer(heat);
 
    return () => map.removeLayer(heat);
  }, [vehicles, map]);
 
  return null;
}
 
/* ─────────────── TRAFFIC LIGHT ─────────────── */
 
function TrafficLight({ signalData }) {
  const [currentLight, setCurrentLight] = useState("green");
  const [timeLeft, setTimeLeft] = useState(0);
 
  useEffect(() => {
    if (!signalData) return;
 
    const { greenSignalDuration = 30, redSignalDuration = 30, yellowSignalDuration = 5 } = signalData;
 
    const cycle = [
      { light: "green",  duration: greenSignalDuration },
      { light: "yellow", duration: yellowSignalDuration },
      { light: "red",    duration: redSignalDuration },
      { light: "yellow", duration: yellowSignalDuration }
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
 
  const lightColor = c =>
    currentLight === c
      ? c === "red" ? "#e74c3c" : c === "yellow" ? "#f1c40f" : "#2ecc71"
      : "#444";
 
  return (
    <div style={{
      position: "fixed", top: 80, left: 20, zIndex: 2000,
      background: "#1a1a2e", padding: 16, borderRadius: 12,
      width: 160, boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      textAlign: "center"
    }}>
      <div style={{ color: "white", fontWeight: "bold", marginBottom: 10, fontSize: 13 }}>
        🚦 SIGNAL
      </div>
 
      <div style={{
        background: "#111", padding: 12, borderRadius: 10,
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 8
      }}>
        {["red", "yellow", "green"].map(c => (
          <div key={c} style={{
            width: 34, height: 34, borderRadius: "50%",
            background: lightColor(c),
            boxShadow: currentLight === c ? `0 0 14px ${lightColor(c)}` : "none",
            transition: "all 0.3s"
          }} />
        ))}
        <div style={{ color: "white", fontSize: 22, fontWeight: "bold", marginTop: 4 }}>
          {timeLeft}s
        </div>
      </div>
 
      <div style={{ color: "#aaa", fontSize: 11, marginTop: 8 }}>
        {signalData.trafficLevel} traffic
      </div>
    </div>
  );
}
 
/* ─────────────── MAIN MAP VIEW ─────────────── */
 
function MapView() {
  const [vehicles,          setVehicles]          = useState([]);
  const [zones,             setZones]             = useState([]);
  const [signalData,        setSignalData]        = useState(null);
  const [collisionWarnings, setCollisionWarnings] = useState([]);
  const [pulse,             setPulse]             = useState(false);
  const [aiExplanation,     setAiExplanation]     = useState("Analyzing traffic...");
 
  /* ── pulse animation for corridor ── */
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 700);
    return () => clearInterval(id);
  }, []);
 
  /* ── fetch vehicles + traffic ── */
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/vehicles/");
        const data = res.data;
        setVehicles(Array.isArray(data) ? data : data.vehicles || data.data || []);
      } catch (e) {
        console.error("fetchVehicles error:", e);
        setVehicles([]);
      }
    };
 
    const fetchTraffic = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/traffic/traffic-analysis");
        setZones(Array.isArray(res.data.congestionZones) ? res.data.congestionZones : []);
      } catch (e) {
        console.error("fetchTraffic error:", e);
        setZones([]);
      }
    };
 
    const fetchCollisions = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/traffic/collision-risk");
        setCollisionWarnings(Array.isArray(res.data.warnings) ? res.data.warnings : []);
      } catch (e) {
        console.error("fetchCollisions error:", e);
        setCollisionWarnings([]);
      }
    };
 
    fetchVehicles();
    fetchTraffic();
    fetchCollisions();
 
    const id = setInterval(() => {
      fetchVehicles();
      fetchTraffic();
      fetchCollisions();
    }, 3000);
 
    return () => clearInterval(id);
  }, []);
 
  /* ── fetch signal data ── */
  useEffect(() => {
    const fetchSignal = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/traffic/signal-decision");
        setSignalData(res.data && typeof res.data === "object" ? res.data : null);
      } catch (e) {
        console.error("fetchSignal error:", e);
        setSignalData(null);
      }
    };
 
    fetchSignal();
    const id = setInterval(fetchSignal, 2000);
    return () => clearInterval(id);
  }, []);
 
  /* ── AI explanation ── */
  useEffect(() => {
    if (!signalData) return;
    const { trafficLevel, emergency } = signalData;
 
    if (emergency) {
      setAiExplanation("🚑 Emergency vehicle detected. Green corridor activated. All signals overridden.");
    } else if (trafficLevel === "Heavy") {
      setAiExplanation("Heavy congestion detected. AI extended green signal to 60s to clear traffic.");
    } else if (trafficLevel === "High") {
      setAiExplanation("High traffic density. Signal timing adjusted to 45s. Monitor for worsening.");
    } else {
      setAiExplanation("Traffic flow is stable. Normal 30s signal cycle active.");
    }
  }, [signalData]);
 
  /* ── derived stats ── */
  const totalVehicles     = vehicles.length;
  const emergencyVehicles = vehicles.filter(v => v.vehicle_id?.includes("AMB")).length;
  const congestionCount   = zones.length;
  const avgSpeed          = totalVehicles > 0
    ? Math.round(vehicles.reduce((s, v) => s + (v.speed || 0), 0) / totalVehicles)
    : 0;
 
  const ambulancePositions = vehicles
    .filter(v => v.vehicle_id?.includes("AMB"))
    .map(v => [v.lat, v.lng]);
 
  const hasCollision = collisionWarnings.length > 0;
 
  return (
    <>
      {/* ── TOP STATS BAR ── */}
      <div style={{
        position: "fixed", top: 14, left: "50%",
        transform: "translateX(-50%)", zIndex: 2000,
        background: "#0d0d1a", color: "white",
        padding: "10px 24px", borderRadius: 50,
        display: "flex", gap: 28, fontSize: 13,
        fontWeight: "bold", boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        border: "1px solid #333", letterSpacing: "0.5px"
      }}>
        <span>🚗 {totalVehicles} Vehicles</span>
        <span>🔥 {congestionCount} Congestion</span>
        <span style={{ color: emergencyVehicles > 0 ? "#ff5555" : "#55ff99" }}>
          🚑 {emergencyVehicles > 0 ? `${emergencyVehicles} ACTIVE` : "None"}
        </span>
        <span style={{ color: hasCollision ? "#ffaa00" : "#aaa" }}>
          ⚠️ {collisionWarnings.length} Collision Risk
        </span>
      </div>
 
      {/* ── MAP ── */}
      <MapContainer
        center={[28.6762, 77.3211]}
        zoom={14}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
 
        <ClusterLayer vehicles={vehicles} />
        <HeatmapLayer vehicles={vehicles} />
 
        {/* Congestion zone markers */}
        {zones.map((z, i) => {
          const parts = z.zone ? z.zone.split("-").map(Number) : [];
          if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
          const [lat, lng] = parts;
          return (
            <Marker key={`zone-${i}`} position={[lat, lng]}
              icon={z.emergency ? ambulanceIcon : normalIcon}>
              <Popup>
                <b>{z.emergency ? "🚑 Emergency Priority" : "🚦 Congestion Zone"}</b><br />
                Density: {z.density}<br />
                Green Time: {z.greenTime}s<br />
                Recommendation: {z.recommendation}<br />
                🔮 {z.prediction}
              </Popup>
            </Marker>
          );
        })}
 
        {/* Ambulance green corridor */}
        {ambulancePositions.length > 1 && (
          <Polyline
            positions={ambulancePositions}
            pathOptions={{
              color: pulse ? "#00ff88" : "#00cc66",
              weight: pulse ? 10 : 6,
              opacity: 0.9,
              dashArray: "12 8"
            }}
          />
        )}
 
        {/* Collision warning markers */}
        {collisionWarnings.map((w, i) => (
          <Marker key={`col-${i}`} position={[w.lat, w.lng]} icon={warningIcon}>
            <Popup>
              <b>⚠️ COLLISION RISK: {w.risk}</b><br />
              {w.message}<br />
              <b>Vehicles:</b> {w.vehicles?.join(" ↔ ")}<br />
              Combined Speed: {w.combinedSpeed} km/h<br />
              Distance: {w.distance}°
            </Popup>
          </Marker>
        ))}
 
        {/* Collision warning circles */}
        {collisionWarnings.map((w, i) => (
          <Circle
            key={`circle-${i}`}
            center={[w.lat, w.lng]}
            radius={60}
            pathOptions={{
              color: w.risk === "CRITICAL" ? "#ff0000" : w.risk === "HIGH" ? "#ff6600" : "#ffaa00",
              fillColor: w.risk === "CRITICAL" ? "#ff0000" : w.risk === "HIGH" ? "#ff6600" : "#ffaa00",
              fillOpacity: pulse ? 0.35 : 0.15,
              weight: 2
            }}
          />
        ))}
      </MapContainer>
 
      {/* ── TRAFFIC LIGHT ── */}
      <TrafficLight signalData={signalData} />
 
      {/* ── SIGNAL DECISIONS PANEL (RIGHT) ── */}
      <div style={{
        position: "fixed", top: 20, right: 20, zIndex: 2000,
        background: "white", padding: 16, borderRadius: 14,
        width: 260, boxShadow: "0 6px 25px rgba(0,0,0,0.25)",
        maxHeight: "75vh", overflowY: "auto"
      }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>🚦 Signal Decisions</h3>
        {zones.length === 0 && (
          <p style={{ color: "#999", fontSize: 12 }}>No congestion detected.</p>
        )}
        {zones.slice(0, 5).map((z, i) => (
          <div key={i} style={{
            marginBottom: 10, padding: 10, borderRadius: 8,
            background: z.emergency ? "#fff0f0" : "#f5f7fa",
            borderLeft: `4px solid ${z.emergency ? "#e74c3c" : "#3498db"}`
          }}>
            <b style={{ fontSize: 12 }}>Zone {i + 1}</b><br />
            <span style={{ fontSize: 11, color: "#555" }}>
              Density: {z.density} vehicles<br />
              🟢 Green: {z.greenTime}s<br />
              {z.emergency && <span style={{ color: "#e74c3c" }}>🚑 Emergency Priority<br /></span>}
              🔮 {z.prediction}
            </span>
          </div>
        ))}
      </div>
 
      {/* ── COLLISION WARNINGS PANEL ── */}
      {collisionWarnings.length > 0 && (
        <div style={{
          position: "fixed", top: 20, left: 190, zIndex: 2000,
          background: "#1a0000", border: "2px solid #ff2d2d",
          padding: 14, borderRadius: 12, width: 240,
          boxShadow: "0 6px 25px rgba(255,0,0,0.4)",
          maxHeight: "60vh", overflowY: "auto"
        }}>
          <h3 style={{ margin: "0 0 10px", color: "#ff4444", fontSize: 14 }}>
            ⚠️ Collision Warnings ({collisionWarnings.length})
          </h3>
          {collisionWarnings.map((w, i) => (
            <div key={i} style={{
              marginBottom: 8, padding: 8, borderRadius: 6,
              background: w.risk === "CRITICAL" ? "#3a0000" : "#2a1000",
              borderLeft: `4px solid ${w.risk === "CRITICAL" ? "#ff0000" : "#ff8800"}`
            }}>
              <b style={{ color: w.risk === "CRITICAL" ? "#ff4444" : "#ffaa00", fontSize: 11 }}>
                {w.risk}
              </b><br />
              <span style={{ color: "#ccc", fontSize: 11 }}>
                {w.vehicles?.join(" ↔ ")}<br />
                {w.message}
              </span>
            </div>
          ))}
        </div>
      )}
 
      {/* ── AI DECISION PANEL (BOTTOM RIGHT) ── */}
      <div style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 2000,
        background: "white", padding: 14, borderRadius: 12,
        width: 260, boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
      }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>🧠 AI Decision</h3>
        <div style={{
          background: "#f0f4ff", padding: 10, borderRadius: 8,
          fontSize: 12, lineHeight: 1.6, color: "#333"
        }}>
          {aiExplanation}
        </div>
      </div>
 
      {/* ── TRAFFIC ANALYTICS (BOTTOM LEFT) ── */}
      <div style={{
        position: "fixed", bottom: 20, left: 20, zIndex: 2000,
        background: "white", padding: 14, borderRadius: 12,
        width: 220, boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
      }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>📊 Traffic Analytics</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
          <div>🚗 Vehicles: <b>{totalVehicles}</b></div>
          <div>🚑 Emergency: <b style={{ color: emergencyVehicles > 0 ? "red" : "green" }}>
            {emergencyVehicles > 0 ? emergencyVehicles : "None"}
          </b></div>
          <div>🔥 Congestion Zones: <b>{congestionCount}</b></div>
          <div>⚡ Avg Speed: <b>{avgSpeed} km/h</b></div>
          <div>⚠️ Collision Risks: <b style={{ color: hasCollision ? "orange" : "green" }}>
            {collisionWarnings.length}
          </b></div>
        </div>
      </div>
    </>
  );
}
 
export default MapView;