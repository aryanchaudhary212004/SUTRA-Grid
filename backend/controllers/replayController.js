const Vehicle = require("../models/Vehicle")

exports.getReplayVehicles = async (req,res) => {

  try{

    const seconds = parseInt(req.query.seconds || 60)

    const time = new Date(Date.now() - seconds*1000)

    const vehicles = await Vehicle.find({
      timestamp: { $gte: time }
    })

    res.json({
      replayTime: seconds,
      vehicles
    })

  }
  catch(err){
    res.status(500).json(err)
  }

}