import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";
import { Polyline } from "react-leaflet";

/* ---------------- ICONS ---------------- */

const normalIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41]
});

const testIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [35, 35]
});

/* ---------------- CLUSTER LAYER ---------------- */

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

  }, [vehicles, map]);

  return null;
}

/* ---------------- HEATMAP ---------------- */

function HeatmapLayer({ vehicles }) {
  const map = useMap();

  useEffect(() => {

    if (!vehicles || vehicles.length === 0) return;

    const heatPoints = vehicles
      .filter(v => v.lat && v.lng)
      .map(v => [v.lat, v.lng, (v.speed || 10) / 100]);

    if (heatPoints.length === 0) return;

    const heat = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 15
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
      position: "absolute",
      top: 80,
      left: 20,
      zIndex: 1000,
      background: "white",
      padding: "15px",
      borderRadius: "10px",
      width: "200px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
    }}>

      <h4>🚦 Traffic Signal</h4>

      <div style={{
        background: "#222",
        padding: "10px",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px"
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

  const [vehicles, setVehicles] = useState([]);
  const [zones, setZones] = useState([]);
  const [signalData, setSignalData] = useState(null);
  const totalVehicles = vehicles.length;
  const congestionCount = zones.length;

  const emergencyVehicle = vehicles.find(v =>
    v.vehicle_id && v.vehicle_id.includes("AMB")
  );
  const corridorRoute = vehicles
  .filter(v => v.vehicle_id && v.vehicle_id.includes("AMB"))
  .map(v => [v.lat, v.lng]);
  /* ---------- VEHICLE + TRAFFIC ---------- */

  useEffect(() => {

    const fetchVehicles = async () => {
      const res = await axios.get("http://localhost:5000/api/vehicles");
      setVehicles(res.data);
    };

    const fetchTraffic = async () => {
      const res = await axios.get("http://localhost:5000/api/traffic-analysis");
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
        <div style={{
  position: "fixed",
  top: "10px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 2000,
  background: "#1a1a2e",
  color: "white",
  padding: "10px 20px",
  borderRadius: "10px",
  display: "flex",
  gap: "25px",
  fontSize: "14px",
  fontWeight: "bold",
  boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
}}>
  🚗 Vehicles: {totalVehicles}
  🚦 Congestion Zones: {congestionCount}
  🚑 Emergency: {emergencyVehicle ? "ACTIVE" : "None"}
</div>

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="© OpenStreetMap contributors"
        />

        <ClusterLayer vehicles={vehicles} />
        <HeatmapLayer vehicles={vehicles} />

        {zones.map((z, i) => {

          const [lat, lng] = z.zone.split("-").map(Number);

          return (
            <Marker key={i} position={[lat, lng]}>
              <Popup>
                🚦 Congestion Detected <br/>
                Density: {z.density} <br/>
                Recommendation: {z.recommendation} <br/>
                Prediction: {z.prediction}
              </Popup>
            </Marker>
          );

        })}
        {corridorRoute.length > 0 && (
  <Polyline
    positions={corridorRoute}
    pathOptions={{
      color: "#00ff88",
      weight: 6,
      dashArray: "10,10"
    }}
  />
)}

      </MapContainer>

      {/* AI Traffic Light */}
      {signalData && <TrafficLight signalData={signalData} />}

      {/* Signal Decision Panel */}

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