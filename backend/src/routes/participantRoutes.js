const express = require("express");

const {
    getParticipants,
    getParticipant,
    createParticipant,
    updateParticipant,
    deleteParticipant,
    deactivateParticipant
} = require("../controllers/participantController");

const {
    verifyToken
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Lindungi seluruh endpoint peserta dengan JWT verifyToken
router.use(verifyToken);

// GET semua peserta
router.get("/", getParticipants);

// GET peserta berdasarkan ID
router.get("/:id", getParticipant);

// POST tambah peserta
router.post("/", createParticipant);

// PUT edit peserta
router.put("/:id", updateParticipant);

// DELETE hapus peserta
router.delete("/:id", deleteParticipant);

// PATCH nonaktifkan peserta
router.patch("/:id/deactivate", deactivateParticipant);

module.exports = router;