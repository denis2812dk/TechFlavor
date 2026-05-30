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

export const editTable = async (req, res, next) => {
    try {
        const { tableId } = req.params;
        const { zoneId, identifier, capacity } = req.body;
        await tableService.updateTable(req.tenantDb, tableId, { zoneId, identifier, capacity });
        res.json({ success: true, message: "Mesa actualizada" });
    } catch (error) { next(error); }
};

export const editZone = async (req, res, next) => {
    try {
        const { zoneId } = req.params;
        const { name } = req.body;
        await tableService.updateZone(req.tenantDb, zoneId, name);
        res.json({ success: true, message: "Zona actualizada" });
    } catch (error) { next(error); }
};

export const changeZoneStatus = async (req, res, next) => {
    try {
        const { zoneId } = req.params;
        const { isActive } = req.body;
        await tableService.updateZoneStatus(req.tenantDb, zoneId, isActive);
        res.json({ success: true, message: "Estado de la zona actualizado" });
    } catch (error) { next(error); }
};