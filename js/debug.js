/**
 * Флаг отладки: при true логирование включено, при false — отключено.
 * Меняйте значение для включения/выключения логов по всему проекту.
 */
(function (g) {
    g.debug = true;

    g.debugLog = function () {
        if (g.debug) {
            console.log.apply(console, arguments);
        }
    };

    g.debugWarn = function () {
        if (g.debug) {
            console.warn.apply(console, arguments);
        }
    };

    g.debugError = function () {
        if (g.debug) {
            console.error.apply(console, arguments);
        }
    };
})(typeof window !== "undefined" ? window : globalThis);
