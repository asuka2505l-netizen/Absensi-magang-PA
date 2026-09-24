const participantModel = require("../models/participantModel");
const crypto = require("crypto");

const getParticipants = async (req, res) => {
    try {
        const participants = await participantModel.getAllParticipants();

        res.json({
            success: true,
            message: "Data peserta berhasil diambil",
            data: participants
        });
    } catch (error) {
        console.error("Get participants error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data peserta",
            error: error.message
        });
    }
};

const getParticipant = async (req, res) => {
    try {
        const { id } = req.params;

        const participant = await participantModel.getParticipantById(id);

        if (!participant) {
            return res.status(404).json({
                success: false,
                message: "Peserta tidak ditemukan"
            });
        }

        res.json({
            success: true,
            message: "Data peserta berhasil diambil",
            data: participant
        });
    } catch (error) {
        console.error("Get participant error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data peserta",
            error: error.message
        });
    }
};

const createParticipant = async (req, res) => {
    try {
        const {
            full_name,
            identity_number,
            institution,
            participant_type,
            phone,
            start_date,
            end_date
        } = req.body;

        if (
            !full_name ||
            !identity_number ||
            !institution ||
            !participant_type
        ) {
            return res.status(400).json({
                success: false,
                message: "Data wajib belum lengkap"
            });
        }

        const qr_token = crypto.randomUUID();

        const participantId = await participantModel.createParticipant({
            full_name,
            identity_number,
            institution,
            participant_type,
            phone,
            qr_token,
            start_date,
            end_date
        });

        const participant =
            await participantModel.getParticipantById(participantId);

        res.status(201).json({
            success: true,
            message: "Peserta berhasil ditambahkan",
            data: participant
        });
    } catch (error) {
        console.error("Create participant error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Nomor identitas peserta sudah terdaftar"
            });
        }

        res.status(500).json({
            success: false,
            message: "Gagal menambahkan peserta",
            error: error.message
        });
    }
};

const updateParticipant = async (req, res) => {
    try {
        const { id } = req.params;

        const existingParticipant =
            await participantModel.getParticipantById(id);

        if (!existingParticipant) {
            return res.status(404).json({
                success: false,
                message: "Peserta tidak ditemukan"
            });
        }

        const {
            full_name,
            identity_number,
            institution,
            participant_type,
            phone,
            status,
            start_date,
            end_date
        } = req.body;

        if (
            !full_name ||
            !identity_number ||
            !institution ||
            !participant_type ||
            !status
        ) {
            return res.status(400).json({
                success: false,
                message: "Data wajib belum lengkap"
            });
        }

        await participantModel.updateParticipant(id, {
            full_name,
            identity_number,
            institution,
            participant_type,
            phone,
            status,
            start_date,
            end_date
        });

        const updatedParticipant =
            await participantModel.getParticipantById(id);

        res.json({
            success: true,
            message: "Data peserta berhasil diperbarui",
            data: updatedParticipant
        });
    } catch (error) {
        console.error("Update participant error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Nomor identitas sudah digunakan peserta lain"
            });
        }

        res.status(500).json({
            success: false,
            message: "Gagal memperbarui data peserta",
            error: error.message
        });
    }
};

const deleteParticipant = async (req, res) => {
    try {
        const { id } = req.params;

        const existingParticipant =
            await participantModel.getParticipantById(id);

        if (!existingParticipant) {
            return res.status(404).json({
                success: false,
                message: "Peserta tidak ditemukan"
            });
        }

        await participantModel.deleteParticipant(id);

        res.json({
            success: true,
            message: "Peserta berhasil dihapus"
        });
    } catch (error) {
        console.error("Delete participant error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal menghapus peserta",
            error: error.message
        });
    }
};

const deactivateParticipant = async (req, res) => {
    try {
        const { id } = req.params;

        const existingParticipant =
            await participantModel.getParticipantById(id);

        if (!existingParticipant) {
            return res.status(404).json({
                success: false,
                message: "Peserta tidak ditemukan"
            });
        }

        await participantModel.updateParticipant(id, {
            full_name: existingParticipant.full_name,
            identity_number: existingParticipant.identity_number,
            institution: existingParticipant.institution,
            participant_type: existingParticipant.participant_type,
            phone: existingParticipant.phone,
            status: "inactive",
            start_date: existingParticipant.start_date,
            end_date: existingParticipant.end_date
        });

        const participant =
            await participantModel.getParticipantById(id);

        res.json({
            success: true,
            message: "Peserta berhasil dinonaktifkan",
            data: participant
        });
    } catch (error) {
        console.error("Deactivate participant error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal menonaktifkan peserta",
            error: error.message
        });
    }
};

module.exports = {
    getParticipants,
    getParticipant,
    createParticipant,
    updateParticipant,
    deleteParticipant,
    deactivateParticipant
};