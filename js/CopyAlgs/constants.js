/**
 * Константы модуля AlgUtils
 * Сообщения UI
 */
export const messages = {
    COPY_LIST_ERROR: "Ошибка получения списка копий:",
    COPY_CREATE_SUCCESS: "Процесс создания новой копии запущен",
	COPY_CREATE_ERROR: "Ошибка создания копии:",
    SYSTEM_BUSY: "Система занята другим процессом. Пожалуйста, подождите.",
    RESTORE_SUCCESS: "Процесс восстановления алгорита запущен",
    RESTORE_ERROR: "Ошибка восстановления алгоритма:",
	COPY_DELETE_SUCCESS: "Запущен процесс удаления копии",
    COPY_DELETE_ERROR: "Ошибка удаления копии:"
};

/**
 * Keys объектов Форсайт
 */
export const foreKeys = {
    DK_EKR_COPY_ALGS_M: 13687366
};

/** 
 * Статусы ответов API 
 */
export const apiStatuses = {
    OK: "OK",
    ERROR: "ERROR",
    OK_LOWER: "ok",
    ERROR_LOWER: "error"
};