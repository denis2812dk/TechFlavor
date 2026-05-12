export const ROLES = Object.freeze({
    ADMIN: "admin",
    CAJERO: "cajero",
    COCINA: "cocina",
    DESPACHO:"despacho",
    OPERADOR: "operador",
    GERENTE: "gerente"
});

export const ROLE_HOME_PATHS = Object.freeze({
    [ROLES.ADMIN]: "/admin",
    [ROLES.CAJERO]: "/cajero",
    [ROLES.COCINA]: "/cocina",
    [ROLES.DESPACHO]: "/despacho",
    [ROLES.OPERADOR]: "/operador",
    [ROLES.GERENTE]: "/gerente"
});
