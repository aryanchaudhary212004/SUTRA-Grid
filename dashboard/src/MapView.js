import { MapContainer, TileLayer } from "react-leaflet";
import { Marker, Popup } from "react-leaflet";
// import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useState } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet.markercluster";
import { useMap } from "react-leaflet";
import "leaflet.heat";

const normalIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41]
});
const testIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [35, 35]
});
const greenSignalIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [35, 35]
});
const redSignalIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [35, 35]
});


function ClusterLayer({ vehicles }) {
  const map = useMap();
  useEffect(() => {
    const markers = L.markerClusterGroup();
    vehicles.forEach((v) => {
  if (!v.lat || !v.lng) return;

  const marker = L.marker([v.lat, v.lng], {
    icon: v.vehicle_id === "MY_TEST" ? testIcon : normalIcon
  });

  marker.bindPopup(`
    <b>ID:</b> ${v.vehicle_id}<br/>
    <b>Speed:</b> ${v.speed}
  `);

  markers.addLayer(marker);
});

    map.addLayer(markers);
    return () => map.removeLayer(markers);
  }, [vehicles, map, onVehicleClick]);
  return null;
}

function HeatmapLayer({ vehicles }) {
  const map = useMap();
  useEffect(() => {
    const heatPoints = vehicles.map(v => [v.lat, v.lng, 0.5]);
    const heat = L.heatLayer(heatPoints, { radius: 25, blur: 15 });
    map.addLayer(heat);
    return () => map.removeLayer(heat);
  }, [vehicles, map]);
  return null;
}

function InfoRow({ label, value, emergency }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 10px",
      background: emergency ? "#fff0f0" : "#f8f9fa",
      borderRadius: "8px",
      fontSize: "13px"
    }}>
      <span style={{ color: "#666" }}>{label}</span>
      <span style={{ fontWeight: "bold", color: emergency ? "#e74c3c" : "#1a1a2e" }}>{value}</span>
    </div>
  );
}

function TrafficLight({ signalData }) {
  const [currentLight, setCurrentLight] = useState("green");
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {

    if (!vehicles || vehicles.length === 0) return;

    const heatPoints = vehicles
      .filter(v => v.lat && v.lng)
      .map(v => [
        v.lat,
        v.lng,
        (v.speed || 10) / 100
      ]);

    if (heatPoints.length === 0) return;

    const { greenSignalDuration, redSignalDuration, yellowSignalDuration } = signalData;

    const cycle = [
      { light: "green", duration: greenSignalDuration },
      { light: "yellow", duration: yellowSignalDuration },
      { light: "red", duration: redSignalDuration },
      { light: "yellow", duration: yellowSignalDuration },
    ];

    let cycleIndex = 0;
    let remaining = cycle[0].duration;
    setCurrentLight(cycle[0].light);
    setTimeLeft(remaining);

    const timer = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        cycleIndex = (cycleIndex + 1) % cycle.length;
        remaining = cycle[cycleIndex].duration;
        setCurrentLight(cycle[cycleIndex].light);
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
 // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalData?.greenSignalDuration, signalData?.redSignalDuration]);

  if (!signalData) return null;

  const { density, greenSignalDuration, redSignalDuration, trafficLevel } = signalData;

  const levelColor =
    trafficLevel === "Heavy" ? "#e74c3c" :
    trafficLevel === "High" ? "#e67e22" :
    trafficLevel === "Moderate" ? "#f39c12" :
    trafficLevel === "Low" ? "#2ecc71" : "#27ae60";

  const levelEmoji =
    trafficLevel === "Very Low" ? "🟢 Very Low Traffic" :
    trafficLevel === "Low" ? "🟡 Low Traffic" :
    trafficLevel === "Moderate" ? "🟠 Moderate Traffic" :
    trafficLevel === "High" ? "🔴 High Traffic" : "🚨 Heavy Traffic";

  return (
    <div style={{
      position: "absolute",
      top: 80,        // ✅ 20 se 80 — zoom buttons ke neeche
      left: 20,
      zIndex: 1000,
      background: "white",
      borderRadius: "12px",
      padding: "15px",
      width: "190px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      fontFamily: "Arial, sans-serif"
    }}>
      <h4 style={{ margin: "0 0 10px 0", color: "#1a1a2e", fontSize: "14px" }}>
        🚦 Traffic Signal
      </h4>

      {/* Traffic level banner */}
      <div style={{
        background: levelColor,
        borderRadius: "8px",
        padding: "5px 8px",
        marginBottom: "10px",
        textAlign: "center",
        color: "white",
        fontSize: "11px",
        fontWeight: "bold"
      }}>
        {levelEmoji}
      </div>

      {/* Traffic Light Box */}
      <div style={{
        background: "#222",
        borderRadius: "10px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px"
      }}>
        {["red", "yellow", "green"].map((c) => (
          <div key={c} style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: currentLight === c
              ? (c === "red" ? "#e74c3c" : c === "yellow" ? "#f39c12" : "#27ae60")
              : "#444",
            boxShadow: currentLight === c
              ? `0 0 15px ${c === "red" ? "#e74c3c" : c === "yellow" ? "#f39c12" : "#27ae60"}`
              : "none",
            transition: "all 0.3s"
          }} />
        ))}
        <div style={{ color: "white", fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Stats */}
      <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "#f8f9fa", borderRadius: "6px" }}>
          <span style={{ color: "#666" }}>🚗 Vehicles</span>
          <span style={{ fontWeight: "bold" }}>{density}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "#f8f9fa", borderRadius: "6px" }}>
          <span style={{ color: "#666" }}>🟢 Green</span>
          <span style={{ fontWeight: "bold", color: "#27ae60" }}>{greenSignalDuration}s</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "#f8f9fa", borderRadius: "6px" }}>
          <span style={{ color: "#666" }}>🔴 Red</span>
          <span style={{ fontWeight: "bold", color: "#e74c3c" }}>{redSignalDuration}s</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderRadius: "6px", background: levelColor + "22" }}>
          <span style={{ color: "#666" }}>📊 Level</span>
          <span style={{ fontWeight: "bold", color: levelColor }}>{trafficLevel}</span>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ vehicle, onClose, corridor }) {
  if (!vehicle) return null;

  return (
    <div style={{
      position: "absolute",
      top: 20,
      right: 20,
      zIndex: 1000,
      background: "white",
      borderRadius: "12px",
      padding: "20px",
      width: "260px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      fontFamily: "Arial, sans-serif",
      maxHeight: "90vh",
      overflowY: "auto"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ margin: 0, color: "#1a1a2e", fontSize: "16px" }}>🚗 Vehicle Info</h3>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <InfoRow label="🆔 Vehicle ID" value={vehicle.vehicle_id} />
        <InfoRow label="⚡ Speed" value={`${vehicle.speed} km/h`} />
        <InfoRow label="🧭 Direction" value={vehicle.direction || "N/A"} />
        <InfoRow label="📍 Latitude" value={vehicle.lat?.toFixed(4)} />
        <InfoRow label="📍 Longitude" value={vehicle.lng?.toFixed(4)} />
        <InfoRow label="🚨 Emergency" value={vehicle.isEmergency ? "YES 🔴" : "No"} emergency={vehicle.isEmergency} />
        <InfoRow label="🛑 Brake" value={vehicle.brake ? "Active" : "Off"} />
      </div>

      {vehicle.isEmergency && corridor.length > 0 && (
        <div style={{ marginTop: "15px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#27ae60", fontSize: "14px" }}>
            🟢 Green Corridor Active
          </h4>
          {corridor.map((signal, idx) => (
            <div key={idx} style={{
              background: signal.status === "GREEN" ? "#eafaf1" : "#fdf2f2",
              border: `1px solid ${signal.status === "GREEN" ? "#27ae60" : "#e74c3c"}`,
              borderRadius: "8px",
              padding: "8px 10px",
              marginBottom: "6px",
              fontSize: "12px"
            }}>
              <div style={{ fontWeight: "bold", color: signal.status === "GREEN" ? "#27ae60" : "#e74c3c" }}>
                🚦 {signal.signalId} — {signal.status}
              </div>
              <div style={{ color: "#666", marginTop: "3px" }}>
                📍 Lat: {signal.lat ? signal.lat.toFixed(4) : (28.676 + idx * 0.001).toFixed(4)}
              </div>
              <div style={{ color: "#666" }}>
                📍 Lng: {signal.lng ? signal.lng.toFixed(4) : (77.321 + idx * 0.002).toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MapView() {
  const [vehicles, setVehicles] = useState([]);
  const [zones, setZones] = useState([]);
  const [corridor, setCorridor] = useState([]);
  const [signalData, setSignalData] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      const res = await axios.get("http://localhost:5000/api/vehicles");
      setVehicles(res.data);
    };

    const fetchTraffic = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/traffic-analysis");
        setZones(res.data.congestionZones);
      } catch (err) {
        console.error(err);
      }
    };

    fetchVehicles();
    fetchTraffic();

    const interval = setInterval(() => {
      fetchVehicles();
      fetchTraffic();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCorridor = async () => {
      const res = await axios.get("http://localhost:5000/api/green-corridor");
      setCorridor(res.data.corridor || []);
    };
    fetchCorridor();
    const interval = setInterval(fetchCorridor, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSignal = async () => {
      const res = await axios.get("http://localhost:5000/api/signal-decision");
      setSignalData(res.data);
    };
    fetchSignal();
    const interval = setInterval(fetchSignal, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
    <MapContainer
      center={[28.6762, 77.3211]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <ClusterLayer vehicles={vehicles} />
      <HeatmapLayer vehicles={vehicles} />

      {zones.map((z, i) => {
        const [lat, lng] = z.zone.split("-").map(Number);

        return (
          <Marker key={i} position={[lat, lng]}>
            <Popup>
              {z.emergency ? "🚑 Emergency Priority" : "🚦 Congestion Detected"} <br/>
              Density: {z.density} <br/>
              Green Time: {z.greenTime}s <br/>
              Recommendation: {z.recommendation} <br/>
              Prediction: {z.prediction}
            </Popup>
          </Marker>
        );
      })}

    </MapContainer>
    <div style={{
      position: "fixed",
      top: 10,
      right: 10,
      zIndex: 1000,
      background: "white",
      padding: "10px",
      borderRadius: "8px",
      width: "250px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
    }}>
      <h3>🚦 Signal Decisions</h3>

      {zones.map((z, i) => (
        <div key={i} style={{ marginBottom: "8px" }}>
          <b>Zone:</b> {z.zone} <br/>
          Density: {z.density} <br/>
          Green Time: {z.greenTime}s <br/>
          🔮 Prediction: {z.prediction}
        </div>
      ))}
    </div>
    </>
  );
}

export default MapView;