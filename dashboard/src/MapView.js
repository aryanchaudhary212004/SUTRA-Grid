import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
    const heatPoints = vehicles.map(v => [
      v.lat,
      v.lng,
      0.5 // intensity
    ]);

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

  useEffect(() => {
    const fetchVehicles = async () => {
      const res = await axios.get("http://localhost:5000/api/vehicles");
      setVehicles(res.data);
    };

    fetchVehicles();
    const interval = setInterval(fetchVehicles, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={[28.6762, 77.3211]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClusterLayer vehicles={vehicles} />
      <HeatmapLayer vehicles={vehicles} />
    </MapContainer>
  );
}

export default MapView;