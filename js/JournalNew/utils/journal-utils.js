/**
 * Утилиты Journal: форматирование дат 
 */

export function dateRU(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
}

export function formatDate(date) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${month.toString().padStart(2, '0')}.${year}`;
}

export function getDateFromString(date) {
    if (date.includes('.')) {
        const [datePart, timePart] = date.split(' ');
        const [day, month, year] = datePart.split('.');
        const [hours, minutes, seconds] = timePart.split(':');
        return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds)
        );
    } else if (date.includes('/')) {
        const [datePart, timePart] = date.split(' ');
        const [month, day, year] = datePart.split('/');
        const [hours, minutes, seconds] = timePart.split(':');
        return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds)
        );
    } else {
        return new Date(date);
    }
}

export function getDateDifference(dateFrom, dateTo) {
    let from = new Date(dateFrom);
    let to = new Date(dateTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        return 'Неверный формат даты';
    }
    if (to < from) {
        [from, to] = [to, from];
    }

    const diffMs = to - from;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const resultParts = [];
    if (days > 0) {
        resultParts.push(`${days} ${pluralize(days, ['день', 'дня', 'дней'])}`);
    }
    if (hours > 0) {
        resultParts.push(`${hours} ${pluralize(hours, ['час', 'часа', 'часов'])}`);
    }
    if (minutes > 0) {
        resultParts.push(`${minutes} ${pluralize(minutes, ['минута', 'минуты', 'минут'])}`);
    }
    if (resultParts.length === 0) {
        resultParts.push('0 минут');
    }
    return resultParts.join(' ');
}

export function pluralize(number, forms) {
    if (number !== 0) {
        const lastDigit = number % 10;
        const lastTwoDigits = number % 100;
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
            return forms[2];
        } else if (lastDigit === 1) {
            return forms[0];
        } else if (lastDigit >= 2 && lastDigit <= 4) {
            return forms[1];
        } else {
            return forms[2];
        }
    } else {
        return '';
    }
}

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

export function formatSelected(state) {
    if (!state.id) {
        return state.text;
    }
    if (state.text && state.text.includes('#;')) {
        return state.text.split('#;')[1];
    }
    return state.text;
}