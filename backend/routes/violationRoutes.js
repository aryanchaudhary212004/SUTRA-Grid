const express = require("express")
const router = express.Router()

const { detectViolations } = require("../controllers/violationController")

router.get("/violations", detectViolations)

module.exports = router