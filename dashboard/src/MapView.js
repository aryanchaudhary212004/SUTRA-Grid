import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
  Circle
} from "react-leaflet";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import Draggable from "react-draggable";

import "leaflet.markercluster";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";

/* ───────────── ICONS ───────────── */

const normalIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const ambulanceIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [35, 35]
});

const warningIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
  iconSize: [35, 35]
});

const testIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [35, 35]
});

/* ───────────── CLUSTER LAYER ───────────── */

function ClusterLayer({ vehicles }) {
  const map = useMap();

  useEffect(() => {

    const markers = L.markerClusterGroup();

    vehicles.forEach(v => {

      if (!v.lat || !v.lng) return;

      const marker = L.marker(
        [v.lat, v.lng],
        {
          icon: v.vehicle_id?.includes("AMB")
            ? ambulanceIcon
            : normalIcon
        }
      );

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

/* ───────────── HEATMAP ───────────── */

function HeatmapLayer({ vehicles }) {
  const map = useMap();

  useEffect(() => {

    if (!vehicles.length) return;

    const points =
      vehicles
        .filter(v => v.lat && v.lng)
        .map(v => [v.lat, v.lng, (v.speed || 10) / 100]);

    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15
    });

    map.addLayer(heat);

    return () => map.removeLayer(heat);

  }, [vehicles, map]);

  return null;
}

/* ───────────── TRAFFIC LIGHT ───────────── */

function TrafficLight({ signalData }) {

  const [light, setLight] = useState("green");
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {

    if (!signalData) return;

    const cycle = [
      { l: "green", t: signalData.greenSignalDuration || 30 },
      { l: "yellow", t: signalData.yellowSignalDuration || 5 },
      { l: "red", t: signalData.redSignalDuration || 30 },
      { l: "yellow", t: signalData.yellowSignalDuration || 5 }
    ];

    let i = 0;
    let remaining = cycle[0].t;

    setLight(cycle[0].l);
    setTimeLeft(remaining);

    const id = setInterval(() => {

      remaining--;
      setTimeLeft(remaining);

      if (remaining <= 0) {

        i = (i + 1) % cycle.length;

        remaining = cycle[i].t;

        setLight(cycle[i].l);
        setTimeLeft(remaining);

      }

    }, 1000);

    return () => clearInterval(id);

  }, [signalData]);

  const color = c =>
    light === c
      ? c === "red"
        ? "#ff4444"
        : c === "yellow"
        ? "#ffcc00"
        : "#00ff88"
      : "#333";

  return (

    <div style={{
      background:"#111",
      padding:14,
      borderRadius:12,
      width:150,
      textAlign:"center"
    }}>

      <div style={{color:"white"}}>🚦 SIGNAL</div>

      {["red","yellow","green"].map(c => (

        <div
          key={c}
          style={{
            width:30,
            height:30,
            borderRadius:"50%",
            background:color(c),
            margin:"6px auto"
          }}
        />

      ))}

      <div style={{color:"white"}}>{timeLeft}s</div>

    </div>

  );
}

/* ───────────── MAIN MAP ───────────── */

function MapView() {

  const [vehicles,setVehicles] = useState([]);
  const [zones,setZones] = useState([]);
  const [signalData,setSignalData] = useState(null);
  const [collisionWarnings,setCollisionWarnings] = useState([]);

  const trafficRef = useRef(null);

  useEffect(() => {

    const load = async () => {

      const v =
        await axios.get("http://localhost:5000/api/vehicles");

      setVehicles(v.data);

      const z =
        await axios.get("http://localhost:5000/api/traffic/traffic-analysis");

      setZones(z.data);

      const s =
        await axios.get("http://localhost:5000/api/traffic/signal-decision");

      setSignalData(s.data);

      const c =
        await axios.get("http://localhost:5000/api/traffic/collision-risk");

      setCollisionWarnings(c.data.warnings || []);

    };

    load();

    const id = setInterval(load,3000);

    return () => clearInterval(id);

  }, []);

  const ambulancePath =
    vehicles
      .filter(v => v.vehicle_id?.includes("AMB"))
      .map(v => [v.lat,v.lng]);

  return (

    <>

      <MapContainer
        center={[28.67,77.32]}
        zoom={14}
        style={{
          height:"100vh",
          width:"100%"
        }}
      >

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <ClusterLayer vehicles={vehicles}/>
        <HeatmapLayer vehicles={vehicles}/>

        {zones.map((z,i)=>{

          const [lat,lng] =
            z.zone.split("-").map(Number);

          return (

            <Marker
              key={i}
              position={[lat,lng]}
              icon={warningIcon}
            >

              <Popup>

                Density: {z.density} <br/>
                {z.prediction}

              </Popup>

            </Marker>

          );

        })}

        {ambulancePath.length > 1 && (

          <Polyline
            positions={ambulancePath}
            pathOptions={{
              color:"#00ff88",
              weight:6
            }}
          />

        )}

        {collisionWarnings.map((w,i)=>(

          <Circle
            key={i}
            center={[w.lat,w.lng]}
            radius={60}
            pathOptions={{color:"red"}}
          />

        ))}

      </MapContainer>

      <Draggable nodeRef={trafficRef}>

        <div
          ref={trafficRef}
          style={{
            position:"fixed",
            top:80,
            left:20
          }}
        >

          <TrafficLight signalData={signalData}/>

        </div>

      </Draggable>

    </>

  );

}

export default MapView;