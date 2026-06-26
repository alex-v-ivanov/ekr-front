/**
 * Утилиты Prognoz: форматирование дат, селектов и парсинг URL.
 * Используется глобальный jQuery ($).
 */

export function formatState(state) {
    if (!state.id) {
        return state.text;
    }
    const text = state.text.split('#;')[1];
    var $state = $(
        '<p class="dropdown__text" >' + text + '</p>'
    );
    return $state;
}

export function formatState2(state) {
    if (!state.id) {
        return state.text;
    }
    var $state = $(
        '<p class="dropdown__text" >' + state.text + '</p>'
    );
    return $state;
}

export function formatSelected(state) {
    if (!state.id) {
        return state.text;
    }
    if (state.text && state.text.includes('#;')) {
        return state.text.split('#;')[1];
    }
    return state.text;
}

export function formatDate(date) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${month.toString().padStart(2, '0')}.${year}`;
}

export function parseDate(date) {
    if (!date || typeof date !== 'string') return null;
    if (!date.includes('-')) {
        const separator = date.includes('/') ? '/' : date.includes('.') ? '.' : null;
        if (separator === null) {
            throw new Error('Invalid date format. Expected "MM/DD/YYYY" or "MM.DD.YYYY".');
        }
        const parts = date.split(separator);
        if (parts.length !== 3) {
            throw new Error('Invalid date format. Expected "MM/DD/YYYY".');
        }
        const month = date.includes('.') ? parseInt(parts[1], 10) - 1 : parseInt(parts[0], 10) - 1;
        const day = date.includes('.') ? parseInt(parts[0], 10) : parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day, 0, 0, 0);
    }
    if (date.includes("T")) {
        date = date.split('T')[0] + "T00:00:00";
    } else {
        date = date + "T00:00:00";
    }
    return new Date(date);
}

export function getYearDiff(startDate, endDate) {
    if (!startDate || !endDate) return null;
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    return Math.abs(endYear - startYear);
}

export function getYearWord(num) {
    const lastTwo = num % 100;
    if (lastTwo >= 11 && lastTwo <= 14) {
        return 'лет';
    }
    const lastDigit = num % 10;
    if (lastDigit === 1) {
        return 'год';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
        return 'года';
    } else {
        return 'лет';
    }
}

export function getJsonFromUrl() {
    let url = decodeURIComponent(location.search);
    let query = url.substr(1);
    let result = {};
    query.split("&").forEach(function (part) {
        let item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}
