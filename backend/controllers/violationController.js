const Vehicle = require("../models/Vehicle")

exports.detectViolations = async (req,res) => {

  try{

    const vehicles = await Vehicle.find()
  .sort({ timestamp: -1 })
  .limit(150)

    const violations = []

    vehicles.forEach(v => {

      /* SPEED VIOLATION */
      if(v.speed > 80){
        violations.push({
          type:"Overspeeding",
          vehicle:v.vehicle_id,
          speed:v.speed,
          lat:v.lat,
          lng:v.lng,
          severity:"HIGH"
        })
      }

      /* SUDDEN BRAKE */
      if(v.brake === true && v.speed > 40){
        violations.push({
          type:"Sudden Brake",
          vehicle:v.vehicle_id,
          lat:v.lat,
          lng:v.lng,
          severity:"MEDIUM"
        })
      }

      /* WRONG DIRECTION */
      if(v.direction === "south"){   // example rule
        violations.push({
          type:"Wrong Direction",
          vehicle:v.vehicle_id,
          lat:v.lat,
          lng:v.lng,
          severity:"HIGH"
        })
      }

    })

    res.json({
      violations,
      count:violations.length
    })

  }

  catch(err){
    res.status(500).json(err)
  }

}