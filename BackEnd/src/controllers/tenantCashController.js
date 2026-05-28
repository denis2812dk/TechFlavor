import * as cashService from "../services/tenantCashService.js";


export const getMyShift = async (req, res, next) => {
    try {
        const shift = await cashService.getCurrentShift(req.tenantDb, req.user.id);
        
        if (!shift) {
            return res.json({ success: true, hasOpenShift: false, shift: null });
        }

        const totals = await cashService.getShiftTotals(req.tenantDb, shift.id);
        res.json({ success: true, hasOpenShift: true, shift: totals });
    } catch (error) { next(error); }
};

export const openMyShift = async (req, res, next) => {
    try {
        const { initialBalance } = req.body;
        const shiftId = await cashService.openShift(req.tenantDb, req.user.id, req.user.name, initialBalance);
        
        res.status(201).json({ success: true, message: "Caja abierta correctamente. ¡Buen turno!", shiftId });
    } catch (error) {
        if (error.message === "SHIFT_ALREADY_OPEN") return res.status(400).json({ success: false, message: "Ya tienes una caja abierta. Ciérrala antes de abrir otra." });
        next(error);
    }
};

export const addMovement = async (req, res, next) => {
    try {
        const { shiftId } = req.params;
        const { type, amount, reason } = req.body;
        
        const movementId = await cashService.registerMovement(
            req.tenantDb, shiftId, type, amount, reason, req.user.id, req.user.name
        );
        
        res.status(201).json({ success: true, message: "Movimiento de caja registrado.", movementId });
    } catch (error) {
        if (error.message === "SHIFT_NOT_FOUND") return res.status(404).json({ success: false, message: "Turno no encontrado." });
        if (error.message === "SHIFT_CLOSED") return res.status(400).json({ success: false, message: "No puedes registrar movimientos en una caja cerrada." });
        next(error);
    }
};

export const getMovements = async (req, res, next) => {
    try {
        const movements = await cashService.getShiftMovements(req.tenantDb, req.params.shiftId);
        res.json({ success: true, movements });
    } catch (error) { next(error); }
};

export const closeMyShift = async (req, res, next) => {
    try {
        const { shiftId } = req.params;
        const { declaredCash, declaredCard, declaredTransfer, notes } = req.body;

        const result = await cashService.closeShift(
            req.tenantDb, shiftId, declaredCash, declaredCard, declaredTransfer, notes
        );

        res.json({ 
            success: true, 
            message: "Caja cerrada correctamente.", 
            differenceCash: result.differenceCash 
        });
    } catch (error) {
        if (error.message === "SHIFT_NOT_FOUND") return res.status(404).json({ success: false, message: "Turno no encontrado." });
        if (error.message === "SHIFT_ALREADY_CLOSED") return res.status(400).json({ success: false, message: "Esta caja ya fue cerrada previamente." });
        next(error);
    }
};


export const getShiftHistory = async (req, res, next) => {
    try {
        const shifts = await cashService.getAllShifts(req.tenantDb);
        res.json({ success: true, shifts });
    } catch (error) { next(error); }
};

export const getShiftDetails = async (req, res, next) => {
    try {
        const totals = await cashService.getShiftTotals(req.tenantDb, req.params.shiftId);
        const movements = await cashService.getShiftMovements(req.tenantDb, req.params.shiftId);
        res.json({ success: true, data: { ...totals, movements } });
    } catch (error) {
        if (error.message === "SHIFT_NOT_FOUND") return res.status(404).json({ success: false, message: "Turno no encontrado." });
        next(error);
    }
};