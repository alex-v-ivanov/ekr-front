/**
 * Общие константы приложения: типы отчётов, статусы API, разделители.
 */

/** Тип отчёта для точки входа и getReportType(). */
export const ReportType = {
    JOURNAL: "Journal",
    PROGNOZ: "Prognoz",
    STRESS: "Stress",
    ALG_UTILS: "AlgUtils"
};

/** Сегменты пути для определения типа отчёта по URL. */
export const PathSegment = {
    PROGNOZ_CONF: "PrognozConf",
    STRESS_CONF: "StressConf",
    ALG_UTILS: "AlgUtils",
    JOURNAL: "Journal"
};

/** Статусы ответов API (единообразно для BI, Stress, Prognoz, AlgUtils). */
export const ApiStatus = {
    OK: "OK",
    ERROR: "ERROR",
    OK_LOWER: "ok",
    ERROR_LOWER: "error"
};

/** Разделитель строк (для списков ошибок и т.п.). */
export const NEW_LINE = "\n";

/** Общие сообщения об ошибках (BI, Metabase и др.). */
export const CommonMessages = {
    REQUEST_ERROR: "Во время выполнения запроса произошла ошибка.",
    SESSION_EXPIRED: "Время сессии истекло. Авторизуйтесь."
};
