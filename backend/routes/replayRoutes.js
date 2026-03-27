const express = require("express")
const router = express.Router()

const { getReplayVehicles } = require("../controllers/replayController")

router.get("/replay", getReplayVehicles)

module.exports = router