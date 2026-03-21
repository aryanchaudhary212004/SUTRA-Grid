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

    return () => {
      map.removeLayer(markers);
    };
  }, [vehicles, map]);

  return null;
}

function HeatmapLayer({ vehicles }) {
  const map = useMap();

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

    const heat = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 15
    });

    map.addLayer(heat);

    return () => {
      map.removeLayer(heat);
    };
  }, [vehicles, map]);

  return null;
}

function MapView() {
  const [vehicles, setVehicles] = useState([]);
  const [zones, setZones] = useState([]);

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
              🚦 Congestion Detected <br/>
              Density: {z.density} <br/>
              Recommendation: {z.recommendation}
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
          Green Time: {z.greenTime}s
        </div>
      ))}
    </div>
    </>
  );
}

export default MapView;