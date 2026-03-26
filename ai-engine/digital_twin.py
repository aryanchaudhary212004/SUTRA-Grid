import json
import random
import sys

# Read vehicle data from backend
data = sys.stdin.read()

vehicles = json.loads(data)

future_vehicles = []

for v in vehicles:

    # simulate future position
    new_lat = v["lat"] + random.uniform(-0.0005,0.0005)
    new_lng = v["lng"] + random.uniform(-0.0005,0.0005)

    future_vehicles.append({
        "vehicle_id": v["vehicle_id"],
        "lat": new_lat,
        "lng": new_lng,
        "speed": v["speed"]
    })

# fake congestion probability
congestion_probability = random.randint(60,95)

result = {
    "futureVehicles": future_vehicles,
    "congestionProbability": congestion_probability
}

print(json.dumps(result))