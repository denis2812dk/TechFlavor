import { randomUUID } from "crypto";
import { eq, and, gte, lte, ne, sql, desc } from "drizzle-orm"; // <-- Agregamos lte y ne
import { cashShifts, cashMovements, orders } from "../models/tenantSchema.js";


export const getCurrentShift = async (tenantDb, userId) => {
    const [shift] = await tenantDb
        .select()
        .from(cashShifts)
        .where(and(eq(cashShifts.cashierUserId, userId), eq(cashShifts.status, "open")))
        .limit(1);
    
    return shift || null;
};

export const openShift = async (tenantDb, userId, userName, initialBalance) => {
    const existingShift = await getCurrentShift(tenantDb, userId);
    if (existingShift) throw new Error("SHIFT_ALREADY_OPEN");

    const shiftId = randomUUID();
    await tenantDb.insert(cashShifts).values({
        id: shiftId,
        cashierUserId: userId,
        cashierName: userName,
        initialBalance: initialBalance,
        status: "open"

    });

    return shiftId;
};


export const registerMovement = async (tenantDb, shiftId, type, amount, reason, userId, userName) => {
    const [shift] = await tenantDb.select().from(cashShifts).where(eq(cashShifts.id, shiftId)).limit(1);
    
    if (!shift) throw new Error("SHIFT_NOT_FOUND");
    if (shift.status !== "open") throw new Error("SHIFT_CLOSED");
    if (type !== "IN" && type !== "OUT") throw new Error("INVALID_MOVEMENT_TYPE");

    const movementId = randomUUID();
    await tenantDb.insert(cashMovements).values({
        id: movementId,
        shiftId,
        type,
        amount,
        reason: reason.trim(),
        userId,
        userName
    });

    return movementId;
};

export const getShiftMovements = async (tenantDb, shiftId) => {
    return await tenantDb
        .select()
        .from(cashMovements)
        .where(eq(cashMovements.shiftId, shiftId))
        .orderBy(desc(cashMovements.createdAt));
};

export const getShiftTotals = async (tenantDb, shiftId) => {
    const [shift] = await tenantDb.select().from(cashShifts).where(eq(cashShifts.id, shiftId)).limit(1);
    if (!shift) throw new Error("SHIFT_NOT_FOUND");

    const orderConditions = [
        eq(orders.cashierUserId, shift.cashierUserId),
        gte(orders.createdAt, shift.openedAt), 
        ne(orders.status, "cancelled")         
    ];
    if (shift.closedAt) {
        orderConditions.push(lte(orders.createdAt, shift.closedAt));
    }

    const ordersSummary = await tenantDb
        .select({
            method: orders.paymentMethod,
            totalAmount: sql`SUM(${orders.total})`
        })
        .from(orders)
        .where(and(...orderConditions))
        .groupBy(orders.paymentMethod);

    const movementsSummary = await tenantDb
        .select({
            type: cashMovements.type,
            totalAmount: sql`SUM(${cashMovements.amount})`
        })
        .from(cashMovements)
        .where(eq(cashMovements.shiftId, shiftId))
        .groupBy(cashMovements.type);

    let salesCash = 0;
    let salesCard = 0;
    let salesTransfer = 0;

    ordersSummary.forEach(row => {
        const amt = Number(row.totalAmount || 0);
        if (row.method === "cash") salesCash += amt;
        if (row.method === "card") salesCard += amt;
        if (row.method === "transfer") salesTransfer += amt;
    });

    let extraIn = 0;
    let extraOut = 0;

    movementsSummary.forEach(row => {
        const amt = Number(row.totalAmount || 0);
        if (row.type === "IN") extraIn += amt;
        if (row.type === "OUT") extraOut += amt;
    });

    const initial = Number(shift.initialBalance);
    const expectedCash = initial + salesCash + extraIn - extraOut;

    return {
        shiftDetails: shift,
        breakdown: {
            initialBalance: initial,
            salesCash,
            salesCard,
            salesTransfer,
            movementsIn: extraIn,
            movementsOut: extraOut
        },
        expected: {
            cash: expectedCash,
            card: salesCard,
            transfer: salesTransfer
        }
    };
};

export const closeShift = async (tenantDb, shiftId, declaredCash, declaredCard, declaredTransfer, notes) => {
    const [shift] = await tenantDb.select().from(cashShifts).where(eq(cashShifts.id, shiftId)).limit(1);
    if (!shift) throw new Error("SHIFT_NOT_FOUND");
    if (shift.status !== "open") throw new Error("SHIFT_ALREADY_CLOSED");

    const totals = await getShiftTotals(tenantDb, shiftId);
    const differenceCash = Number(declaredCash) - totals.expected.cash;

    await tenantDb.update(cashShifts).set({
        status: "closed",
        closedAt: sql`CURRENT_TIMESTAMP`, 
        
        expectedCash: totals.expected.cash,
        expectedCard: totals.expected.card,
        expectedTransfer: totals.expected.transfer,
        
        declaredCash: Number(declaredCash),
        declaredCard: Number(declaredCard),
        declaredTransfer: Number(declaredTransfer),
        
        cashDifference: differenceCash,
        notes: notes?.trim() || null
    }).where(eq(cashShifts.id, shiftId));

    return {
        success: true,
        differenceCash
    };
};


export const getAllShifts = async (tenantDb) => {
    return await tenantDb
        .select()
        .from(cashShifts)
        .orderBy(desc(cashShifts.openedAt));
};