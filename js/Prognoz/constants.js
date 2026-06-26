/**
 * Константы модуля Prognoz: типы конфигуратора, сообщения UI.
 */

/**
 * Если true: не проверяем группы AD; выставляем как у суперпользователя (typeSuper/typeModel) —
 * в т.ч. кнопка «Расширенная версия» в ограниченном режиме (type=1) и правки чужих сценариев.
 * Режим из URL (1/2/…) не подменяется.
 */
export const PROGNOZ_BYPASS_ACCESS_CHECKS = true;

/** Тип конфигуратора прогноза (числовые значения). */
export const PrognozType = {
    TYPE_0: 0,
    TYPE_1: 1,
    TYPE_2: 2
};

/** Сообщения для showDialog. */
export const PrognozMessages = {
    USER_INFO_FAILED: "Не удалось получить информацию о пользователе. Авторизуйтесь.",
    COULD_NOT_DETERMINE_SCENARIO: "Не удалось определить сценарий",
    FILL_SCENARIO_RCFF: "Заполните поле Сценарий прогноза RCFF",
    SCENARIO_SAVED: "Сценарий успешно сохранен",
    SCENARIO_SAVE_FAILED: "Не удалоь сохранить сценарий. Сценарий с таким именем уже существует.\n Пожалуйста, добавьте уникальный маркер или измените название.",
    MARKER_NOT_FILLED: "Ошибка: Не заполнен маркер",
    SCENARIO_UPDATED: "Сценарий успешно изменен",
    CAN_EDIT_OWN_ONLY: "Вы можете изменять только свои сценарии",
    FILL_DEPTH: "Заполните поле Глубина",
    FILL_HORIZON: "Заполните поле Горизонт",
    FILL_VERSION_RCFF: "Заполните поле Версия прогноза RCFF",
    VERSION_MARKER_EXISTS: "Версия с таким маркером уже существует, просьба изменить маркер",
    CALC_STARTED: "Расчет запущен. Для получения информации о завершенных и текущих расчетах перейдите в журнал по кнопке 'Журнал расчета'",
    SCENARIO_DELETED: "Сценарий ",
    SCENARIO_DELETED_SUFFIX: " успешно удален",
    SCENARIO_DELETED_FULL: "Версия ",
    SCENARIO_DELETED_FULL_SUFFIX: " успешно удалена",
    CAN_DELETE_OWN_ONLY: "Вы можете удалять только свои сценарии",
    ERROR_PREFIX: "Ошибка: "
};
