const express = require("express")
const router = express.Router()

const { runSimulation } = require("../controllers/simulationController")

router.get("/simulate",runSimulation)

module.exports = router