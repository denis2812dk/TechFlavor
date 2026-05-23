import * as tableService from "../services/tenantTableService.js";

export const getSalon = async (req, res, next) => {
    try {
        const salon = await tableService.getSalonStatus(req.tenantDb);
        res.json({ success: true, salon });
    } catch (error) { next(error); }
};

export const addZone = async (req, res, next) => {
    try {
        const { name } = req.body;
        await tableService.createZone(req.tenantDb, name);
        res.status(201).json({ success: true, message: "Zona creada" });
    } catch (error) { next(error); }
};

export const addTable = async (req, res, next) => {
    try {
        const { zoneId, identifier, capacity } = req.body;
        await tableService.createTable(req.tenantDb, { zoneId, identifier, capacity });
        res.status(201).json({ success: true, message: "Mesa creada" });
    } catch (error) { next(error); }
};

export const changeTableStatus = async (req, res, next) => {
    try {
        const { tableId } = req.params;
        const { status } = req.body;
        await tableService.updateTableStatus(req.tenantDb, tableId, status);
        res.json({ success: true, message: "Estado actualizado" });
    } catch (error) { next(error); }
};