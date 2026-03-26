const Vehicle = require("../models/Vehicle")

exports.runSimulation = async (req,res) => {

  try{

    const vehicles = await Vehicle.find()
    .sort({ timestamp: -1 })
    .limit(150)

    const simulated = vehicles.map(v => ({

      vehicle_id: v.vehicle_id,

      lat: v.lat + (Math.random() - 0.5) * 0.001,

      lng: v.lng + (Math.random() - 0.5) * 0.001,

      speed: v.speed,
      direction: v.direction


    }))

    res.json({
      futureVehicles: simulated,
      congestionProbability: Math.floor(Math.random()*40)+60
    })

  }

  catch(err){

    res.status(500).json(err)

  }

}