/** Убирает управляющие и нестандартные символы из строки даты (исправляет нечитаемые символы в диапазоне дат). */
export function sanitizeDateRangeText(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

const SELECT_TEXT_SEP = '#;';

/**
 * Находит элемент в массиве по значению ключа (часть до '#;' в item.text).
 * @param {Array<{text: string}>} items - массив элементов с полем text в формате "key#;displayText"
 * @param {string} value - искомое значение ключа
 * @returns {Object|undefined} найденный элемент или undefined
 */
export function findItemByKey(items, value) {
    if (!items || !value) return undefined;
    return items.find(item => {
        const text = item && item.text;
        if (!text || typeof text !== 'string') return false;
        const key = text.includes(SELECT_TEXT_SEP) ? text.split(SELECT_TEXT_SEP)[0] : text;
        return key === value;
    });
}

/**
 * Подставляет в строку значение из fieldData: ищет элемент в items по ключу и устанавливает текст и атрибут в $row.
 * Ничего не делает, если fieldData отсутствует или value === "-1".
 * @param {{value: string}|undefined} fieldData - объект с полем value (ключ для поиска)
 * @param {Array<{text: string}>} items - массив элементов с полем text в формате "key#;displayText"
 * @param {jQuery} $row - jQuery-элемент строки/поля
 * @param {{textSelector: string, valueAttr?: string}} options - textSelector: селектор для элемента с текстом; valueAttr: необязательный атрибут для установки на $row
 */
export function applyFieldDataToRow(fieldData, items, $row, options = {}) {
    if (fieldData === undefined || fieldData === null) return;
    const value = fieldData.value;
    if (value === undefined || value === "-1") return;
    const item = findItemByKey(items, value);
    if (item === undefined) return;
    const displayText = item.text.includes(SELECT_TEXT_SEP) ? item.text.split(SELECT_TEXT_SEP)[1] : item.text;
    const textSelector = options.textSelector || '.SelectAnalysisFieldText';
    const $textEl = $row.find ? $row.find(textSelector) : $row;
    if ($textEl.length) $textEl.text(displayText);
    if (options.valueAttr && $row.attr) $row.attr(options.valueAttr, value);
}

export function formatState (state) {
    if (!state.id) {
      return state.text;
    }
    const text = state.text.split('#;')[1];
    var $state = $(
      '<p class="dropdown__text" >' + text + '</p>'
    );
    return $state;
  };

export function formatState2 (state) {
    if (!state.id) {
        return state.text;
    }
    var $state = $(
        '<p class="dropdown__text" >' + state.text + '</p>'
    );
    return $state;
};

export function formatState3 (state) {
    if (!state.id) {
      return state.text;
    }
    var $state = $(
      '<p class="dropdown__text" >' + state.text + '</p>'
    );
    return $state;
  };

export function formatDistribution (state){
    if (!state.id) {
        return state.text;
      }
    const text = state.text.split('#;')[1];
    var $state = $(`<div class="dropdown__block">
            <img class="dropdown__img" src="img/distribution/${text}.svg">
            <p class="dropdown__text" >${text}</p>
        </div>`);
    return $state;
}

export function formatSelected (state) {
    if (!state.id) {
        return state.text; // Плейсхолдер или пустое значение
    }
    
    // Если state.text содержит разделитель '#;', берем вторую часть
    if (state.text && state.text.includes('#;')) {
        return state.text.split('#;')[1];
    }
    
    // Иначе возвращаем текст как есть
    return state.text;
};

export function matcherTemplate(params, data){
    if(!params.term || params.term.trim === ''){
        return data;
    }

    const searchTerm = params.term.trim().toLowerCase();
    const dataText = data.text.toLowerCase();

    const isNumberInput = /^\d+$/.test(searchTerm);

    if(isNumberInput){
        const match = dataText.match(/^(\d+)#?/);
        if(match && match[1] === searchTerm){
            return data;
        }
    }else{
        if(dataText.includes(searchTerm)){
            return data;
        }
    }
    return null;
}

export function formatSelected2 (state) {
    if (!state.id) {
        return state.text; // Плейсхолдер или пустое значение
    }
    
    // Если state.text содержит разделитель '#;', берем вторую часть
    if (state.text && state.text.includes('#;')) {
        return state.text.split('#;')[1];
    }
    
    // Иначе возвращаем текст как есть
    return state.text;
};

export function toFixedNoRounding(num, decimals) {
    const str = num.toString();
    const dotIndex = str.indexOf(".");

    if(dotIndex === -1) return str;

    return str.substring(0, dotIndex + decimals + 1);
}

export function formatDate(date){
    const month = date.getMonth() + 1; // месяцы от 0 до 11, поэтому +1
    const year = date.getFullYear();

    const formattedDate = `${month.toString().padStart(2, '0')}.${year}`;
    return formattedDate;
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

export function GoToPage(type){ // 1 - Финансовые риски, 2 - Формы ввода
    const root = window.parent.location.href.split('#')[0];
    
    if(type === 1){
        window.parent.location.href = root + '#/app/navigator?key=1146534';
    }else if(type === 2){
        window.parent.location.href = root + '#/app/navigator?key=1146525';
    }
}

export function getInputTemplate(){
    return $(`
        <li class="ListRow" isActive="false">
            <div class="RowItem RowInlineContent LongItem" field="Number" style="border:unset;">
                <div mode="view" class="hidden">
                    <span class="RowItemName">0</span> 
                </div>
                <div mode="editor">
                    <span class="RowItemName">0</span> 
                </div>
            </div>
            <div class="RowItem RowInlineContent LongItem" field="Indicator" style="border:unset;">
                <span class="RowItemName hidden" mode="view"></span>
                <div mode="editor" style="display: flex; gap: 0.5rem; align-items: center;">
                    <label class="dropdown">
                        <select class="indicator"></select>
                        <svg width="18" height="18" viewBox="0 0 32 32" fill="#004C97"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M26.7074 12.7075L16.7074 22.7075C16.6146 22.8005 16.5043 22.8742 16.3829 22.9246C16.2615 22.9749 16.1314 23.0008 15.9999 23.0008C15.8685 23.0008 15.7384 22.9749 15.617 22.9246C15.4956 22.8742 15.3853 22.8005 15.2924 22.7075L5.29245 12.7075C5.1048 12.5199 4.99939 12.2654 4.99939 12C4.99939 11.7346 5.1048 11.4801 5.29245 11.2925C5.48009 11.1049 5.73458 10.9995 5.99995 10.9995C6.26531 10.9995 6.5198 11.1049 6.70745 11.2925L15.9999 20.5863L25.2924 11.2925C25.3854 11.1996 25.4957 11.1259 25.6171 11.0756C25.7384 11.0253 25.8686 10.9995 25.9999 10.9995C26.1313 10.9995 26.2614 11.0253 26.3828 11.0756C26.5042 11.1259 26.6145 11.1996 26.7074 11.2925C26.8004 11.3854 26.8741 11.4957 26.9243 11.6171C26.9746 11.7385 27.0005 11.8686 27.0005 12C27.0005 12.1314 26.9746 12.2615 26.9243 12.3829C26.8741 12.5043 26.8004 12.6146 26.7074 12.7075Z" />
                        </svg>
                    </label>
                    <svg data-rowBtn="filteringIndicator" width="24" height="24" style="cursor: pointer;" tooltipe="Фильтр" fill="#004c97" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M28.825 6.19125C28.6711 5.83564 28.4161 5.53312 28.0916 5.32132C27.7671 5.10952 27.3875 4.99778 27 5H5.00003C4.61294 5.00076 4.23439 5.11384 3.91031 5.32551C3.58622 5.53718 3.33053 5.83835 3.17424 6.19248C3.01795 6.54661 2.96778 6.93849 3.02983 7.32057C3.09187 7.70265 3.26346 8.05852 3.52378 8.345L3.53378 8.35625L12 17.3963V27C11.9999 27.362 12.0981 27.7172 12.284 28.0278C12.4699 28.3383 12.7367 28.5926 13.0558 28.7635C13.3749 28.9344 13.7343 29.0155 14.0959 28.9982C14.4574 28.9808 14.8075 28.8657 15.1088 28.665L19.1088 25.9975C19.383 25.8149 19.6078 25.5673 19.7633 25.2768C19.9188 24.9864 20.0001 24.662 20 24.3325V17.3963L28.4675 8.35625L28.4775 8.345C28.7406 8.05983 28.9138 7.70349 28.9756 7.32046C29.0374 6.93744 28.9851 6.54469 28.825 6.19125ZM18.5425 16.035C18.1951 16.4032 18.0011 16.89 18 17.3963V24.3325L14 27V17.3963C14.0012 16.8882 13.808 16.3989 13.46 16.0288L5.00003 7H27L18.5425 16.035Z" />
                    </svg>
                </div>
            </div>
            <div class="RowItem RowInlineContent " field="Product" style="border:unset;">
                <span class="RowItemName hidden" mode="view"></span>
                <span class="RowItemName" mode="editor"></span>
            </div>
            <div class="RowItem RowInlineContent LongItem" field="Distribution" style="border:unset;display: grid;grid-template-columns: 1fr auto;">
                <span class="RowItemName hidden" mode="view"></span>
                <div mode="editor" style="display: flex; gap: 0.5rem; align-items: center;">
                    <label class="dropdown">
                        <select class="distribution"></select>
                        <svg width="18" height="18" viewBox="0 0 32 32" fill="#004C97"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M26.7074 12.7075L16.7074 22.7075C16.6146 22.8005 16.5043 22.8742 16.3829 22.9246C16.2615 22.9749 16.1314 23.0008 15.9999 23.0008C15.8685 23.0008 15.7384 22.9749 15.617 22.9246C15.4956 22.8742 15.3853 22.8005 15.2924 22.7075L5.29245 12.7075C5.1048 12.5199 4.99939 12.2654 4.99939 12C4.99939 11.7346 5.1048 11.4801 5.29245 11.2925C5.48009 11.1049 5.73458 10.9995 5.99995 10.9995C6.26531 10.9995 6.5198 11.1049 6.70745 11.2925L15.9999 20.5863L25.2924 11.2925C25.3854 11.1996 25.4957 11.1259 25.6171 11.0756C25.7384 11.0253 25.8686 10.9995 25.9999 10.9995C26.1313 10.9995 26.2614 11.0253 26.3828 11.0756C26.5042 11.1259 26.6145 11.1996 26.7074 11.2925C26.8004 11.3854 26.8741 11.4957 26.9243 11.6171C26.9746 11.7385 27.0005 11.8686 27.0005 12C27.0005 12.1314 26.9746 12.2615 26.9243 12.3829C26.8741 12.5043 26.8004 12.6146 26.7074 12.7075Z" />
                        </svg>
                    </label>
                    <svg data-rowBtn="filteringDistribution" width="24" height="24" style="cursor: pointer;" tooltipe="Фильтр" fill="#004c97" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M28.825 6.19125C28.6711 5.83564 28.4161 5.53312 28.0916 5.32132C27.7671 5.10952 27.3875 4.99778 27 5H5.00003C4.61294 5.00076 4.23439 5.11384 3.91031 5.32551C3.58622 5.53718 3.33053 5.83835 3.17424 6.19248C3.01795 6.54661 2.96778 6.93849 3.02983 7.32057C3.09187 7.70265 3.26346 8.05852 3.52378 8.345L3.53378 8.35625L12 17.3963V27C11.9999 27.362 12.0981 27.7172 12.284 28.0278C12.4699 28.3383 12.7367 28.5926 13.0558 28.7635C13.3749 28.9344 13.7343 29.0155 14.0959 28.9982C14.4574 28.9808 14.8075 28.8657 15.1088 28.665L19.1088 25.9975C19.383 25.8149 19.6078 25.5673 19.7633 25.2768C19.9188 24.9864 20.0001 24.662 20 24.3325V17.3963L28.4675 8.35625L28.4775 8.345C28.7406 8.05983 28.9138 7.70349 28.9756 7.32046C29.0374 6.93744 28.9851 6.54469 28.825 6.19125ZM18.5425 16.035C18.1951 16.4032 18.0011 16.89 18 17.3963V24.3325L14 27V17.3963C14.0012 16.8882 13.808 16.3989 13.46 16.0288L5.00003 7H27L18.5425 16.035Z" />
                    </svg>
                </div>
                <svg data-rowBtn="selection" width="24" height="24" type="1" style="cursor: pointer;" tooltipe="Подбор" viewBox="0 0 32 32" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 11H9.125C9.3453 11.8604 9.8457 12.623 10.5473 13.1676C11.2489 13.7122 12.1118 14.0078 13 14.0078C13.8882 14.0078 14.7511 13.7122 15.4527 13.1676C16.1543 12.623 16.6547 11.8604 16.875 11H27C27.2652 11 27.5196 10.8946 27.7071 10.7071C27.8946 10.5195 28 10.2652 28 9.99997C28 9.73475 27.8946 9.4804 27.7071 9.29286C27.5196 9.10533 27.2652 8.99997 27 8.99997H16.875C16.6547 8.13955 16.1543 7.37693 15.4527 6.83233C14.7511 6.28773 13.8882 5.99213 13 5.99213C12.1118 5.99213 11.2489 6.28773 10.5473 6.83233C9.8457 7.37693 9.3453 8.13955 9.125 8.99997H5C4.73478 8.99997 4.48043 9.10533 4.29289 9.29286C4.10536 9.4804 4 9.73475 4 9.99997C4 10.2652 4.10536 10.5195 4.29289 10.7071C4.48043 10.8946 4.73478 11 5 11ZM13 7.99997C13.3956 7.99997 13.7822 8.11727 14.1111 8.33703C14.44 8.55679 14.6964 8.86915 14.8478 9.2346C14.9991 9.60006 15.0387 10.0022 14.9616 10.3902C14.8844 10.7781 14.6939 11.1345 14.4142 11.4142C14.1345 11.6939 13.7781 11.8844 13.3902 11.9615C13.0022 12.0387 12.6001 11.9991 12.2346 11.8477C11.8692 11.6964 11.5568 11.44 11.3371 11.1111C11.1173 10.7822 11 10.3955 11 9.99997C11 9.46954 11.2107 8.96083 11.5858 8.58576C11.9609 8.21068 12.4696 7.99997 13 7.99997ZM27 21H24.875C24.6547 20.1396 24.1543 19.3769 23.4527 18.8323C22.7511 18.2877 21.8882 17.9921 21 17.9921C20.1118 17.9921 19.2489 18.2877 18.5473 18.8323C17.8457 19.3769 17.3453 20.1396 17.125 21H5C4.73478 21 4.48043 21.1053 4.29289 21.2929C4.10536 21.4804 4 21.7348 4 22C4 22.2652 4.10536 22.5195 4.29289 22.7071C4.48043 22.8946 4.73478 23 5 23H17.125C17.3453 23.8604 17.8457 24.623 18.5473 25.1676C19.2489 25.7122 20.1118 26.0078 21 26.0078C21.8882 26.0078 22.7511 25.7122 23.4527 25.1676C24.1543 24.623 24.6547 23.8604 24.875 23H27C27.2652 23 27.5196 22.8946 27.7071 22.7071C27.8946 22.5195 28 22.2652 28 22C28 21.7348 27.8946 21.4804 27.7071 21.2929C27.5196 21.1053 27.2652 21 27 21ZM21 24C20.6044 24 20.2178 23.8827 19.8889 23.6629C19.56 23.4431 19.3036 23.1308 19.1522 22.7653C19.0009 22.3999 18.9613 21.9978 19.0384 21.6098C19.1156 21.2218 19.3061 20.8655 19.5858 20.5858C19.8655 20.3061 20.2219 20.1156 20.6098 20.0384C20.9978 19.9612 21.3999 20.0008 21.7654 20.1522C22.1308 20.3036 22.4432 20.5599 22.6629 20.8888C22.8827 21.2177 23 21.6044 23 22C23 22.5304 22.7893 23.0391 22.4142 23.4142C22.0391 23.7893 21.5304 24 21 24Z" />
                </svg>
            </div>
            <div class="RowItem RowImageItem ShortItem" field="Schedule" style="border:unset;">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" alt="graph" width="1" height="1" />
            </div>
            <div class="RowItem RowInlineContent " field="Options" style="border:unset; width: 100%; flex-direction: column; justify-content: center; height: 100%; align-items: flex-start;">
            </div>
            <div class="RowItem RowInlineContent LongItem" field="HistoricalRange" style="border:unset; min-width: 115px; max-width: 230px; justify-content: center;flex-direction: column;height: 100%;">
                <span class="RowItemName hidden" mode="view"></span>
                <div mode="editor">
                    <div class="datepicker">
                        <input input="dateFrom" type="text" autocomplete="off">
                        <span style="color: var(--color-primary);">-</span>
                        <input input="dateTo" type="text" autocomplete="off">
                    </div>
                </div>
            </div>
            <div class="RowItem RowInlineContent " field="AcceptableRange" style="border:unset; justify-content: center;">
                <span class="RowItemName hidden" mode="view"></span>
                <span class="RowItemName" mode="editor"></span>
            </div>
            <div class="RowItem RowInlineContent" style="border:unset; height: 100%;">
                <div style="margin-left: auto;gap: 0.5rem;align-items: center;display: grid;grid-template-columns: 1fr 1fr 1fr;height: max-content;">
                    <div class="">
                        <div mode="view" class="hidden" style="display:flex; gap: 0.5rem; align-items: center;">
                            <svg data-rowBtn="fileInfo" class="invisibility" width="24" height="24" tooltipe="файл" fill="#004c97" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                <path d="M26.2075 15.2925C26.3005 15.3854 26.3742 15.4957 26.4245 15.6171C26.4749 15.7384 26.5008 15.8686 26.5008 16C26.5008 16.1314 26.4749 16.2615 26.4245 16.3829C26.3742 16.5043 26.3005 16.6146 26.2075 16.7075L15.9512 26.9575C14.6382 28.2703 12.8575 29.0078 11.0008 29.0077C9.14406 29.0075 7.36342 28.2699 6.0506 26.9569C4.73778 25.6439 4.00031 23.8632 4.00043 22.0064C4.00054 20.1497 4.73824 18.3691 6.05123 17.0562L18.4587 4.46624C19.3961 3.52787 20.6678 3.00031 21.9942 2.9996C23.3206 2.9989 24.5929 3.52512 25.5312 4.46249C26.4696 5.39987 26.9972 6.67161 26.9979 7.99796C26.9986 9.32432 26.4724 10.5966 25.535 11.535L13.125 24.125C12.5614 24.6886 11.797 25.0052 11 25.0052C10.2029 25.0052 9.43856 24.6886 8.87498 24.125C8.31139 23.5614 7.99477 22.797 7.99477 22C7.99477 21.203 8.31139 20.4386 8.87498 19.875L19.2875 9.29749C19.3787 9.20019 19.4884 9.12211 19.6103 9.06786C19.7321 9.01361 19.8636 8.98428 19.9969 8.9816C20.1303 8.97892 20.2628 9.00293 20.3867 9.05224C20.5106 9.10154 20.6234 9.17513 20.7185 9.26869C20.8136 9.36224 20.8889 9.47386 20.9402 9.59698C20.9915 9.72011 21.0176 9.85224 21.017 9.98561C21.0165 10.119 20.9892 10.2509 20.9369 10.3736C20.8846 10.4963 20.8083 10.6072 20.7125 10.7L10.2987 21.2887C10.2055 21.3812 10.1314 21.4912 10.0806 21.6123C10.0299 21.7335 10.0035 21.8634 10.003 21.9948C10.0025 22.1261 10.0278 22.2563 10.0776 22.3778C10.1274 22.4993 10.2006 22.6099 10.2931 22.7031C10.3856 22.7964 10.4956 22.8705 10.6167 22.9212C10.7378 22.9719 10.8678 22.9983 10.9991 22.9989C11.1305 22.9994 11.2606 22.974 11.3822 22.9242C11.5037 22.8745 11.6142 22.8012 11.7075 22.7087L24.1162 10.125C24.6798 9.56257 24.9969 8.79929 24.9977 8.00309C24.9985 7.20688 24.683 6.44295 24.1206 5.87937C23.5582 5.31578 22.7949 4.9987 21.9987 4.99788C21.2025 4.99706 20.4386 5.31257 19.875 5.87499L7.46998 18.46C7.00526 18.924 6.63648 19.4749 6.3847 20.0814C6.13291 20.6879 6.00305 21.3381 6.00253 21.9948C6.00201 22.6514 6.13083 23.3018 6.38165 23.9087C6.63247 24.5156 7.00037 25.0672 7.46435 25.5319C7.92833 25.9966 8.47929 26.3654 9.08579 26.6171C9.69229 26.8689 10.3424 26.9988 10.9991 26.9993C11.6558 26.9998 12.3062 26.871 12.9131 26.6202C13.52 26.3694 14.0715 26.0015 14.5362 25.5375L24.7937 15.2875C24.9819 15.1008 25.2365 14.9964 25.5016 14.9973C25.7667 14.9983 26.0206 15.1044 26.2075 15.2925Z" />
                            </svg>
                        </div>
                        <div mode="editor" style="display:flex; gap: 0.5rem; align-items: center;">
                            <svg data-rowBtn="fileRemove" class="invisibility" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Удалить файл" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                                <path d="M26.7075 10.2925L19.7075 3.2925C19.6146 3.19967 19.5042 3.12605 19.3829 3.07586C19.2615 3.02568 19.1314 2.9999 19 3H7C6.46957 3 5.96086 3.21071 5.58579 3.58579C5.21071 3.96086 5 4.46957 5 5V27C5 27.5304 5.21071 28.0391 5.58579 28.4142C5.96086 28.7893 6.46957 29 7 29H25C25.5304 29 26.0391 28.7893 26.4142 28.4142C26.7893 28.0391 27 27.5304 27 27V11C27.0001 10.8686 26.9743 10.7385 26.9241 10.6172C26.8739 10.4958 26.8003 10.3854 26.7075 10.2925ZM20 6.41375L23.5863 10H20V6.41375ZM25 27H7V5H18V11C18 11.2652 18.1054 11.5196 18.2929 11.7071C18.4804 11.8946 18.7348 12 19 12H25V27ZM19.7075 16.7075L17.4137 19L19.7075 21.2925C19.8004 21.3854 19.8741 21.4957 19.9244 21.6171C19.9747 21.7385 20.0006 21.8686 20.0006 22C20.0006 22.1314 19.9747 22.2615 19.9244 22.3829C19.8741 22.5043 19.8004 22.6146 19.7075 22.7075C19.6146 22.8004 19.5043 22.8741 19.3829 22.9244C19.2615 22.9747 19.1314 23.0006 19 23.0006C18.8686 23.0006 18.7385 22.9747 18.6171 22.9244C18.4957 22.8741 18.3854 22.8004 18.2925 22.7075L16 20.4137L13.7075 22.7075C13.6146 22.8004 13.5043 22.8741 13.3829 22.9244C13.2615 22.9747 13.1314 23.0006 13 23.0006C12.8686 23.0006 12.7385 22.9747 12.6171 22.9244C12.4957 22.8741 12.3854 22.8004 12.2925 22.7075C12.1996 22.6146 12.1259 22.5043 12.0756 22.3829C12.0253 22.2615 11.9994 22.1314 11.9994 22C11.9994 21.8686 12.0253 21.7385 12.0756 21.6171C12.1259 21.4957 12.1996 21.3854 12.2925 21.2925L14.5863 19L12.2925 16.7075C12.1049 16.5199 11.9994 16.2654 11.9994 16C11.9994 15.7346 12.1049 15.4801 12.2925 15.2925C12.4801 15.1049 12.7346 14.9994 13 14.9994C13.2654 14.9994 13.5199 15.1049 13.7075 15.2925L16 17.5863L18.2925 15.2925C18.3854 15.1996 18.4957 15.1259 18.6171 15.0756C18.7385 15.0253 18.8686 14.9994 19 14.9994C19.1314 14.9994 19.2615 15.0253 19.3829 15.0756C19.5043 15.1259 19.6146 15.1996 19.7075 15.2925C19.8004 15.3854 19.8741 15.4957 19.9244 15.6171C19.9747 15.7385 20.0006 15.8686 20.0006 16C20.0006 16.1314 19.9747 16.2615 19.9244 16.3829C19.8741 16.5043 19.8004 16.6146 19.7075 16.7075Z" />
                            </svg>
                        </div>
                    </div>
                    <svg data-rowBtn="loadingFile" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Загрузка из EXCEL" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                            <path d="M26.7075 10.2925L19.7075 3.2925C19.6146 3.19967 19.5042 3.12605 19.3829 3.07586C19.2615 3.02568 19.1314 2.9999 19 3H7C6.46957 3 5.96086 3.21071 5.58579 3.58579C5.21071 3.96086 5 4.46957 5 5V27C5 27.5304 5.21071 28.0391 5.58579 28.4142C5.96086 28.7893 6.46957 29 7 29H25C25.5304 29 26.0391 28.7893 26.4142 28.4142C26.7893 28.0391 27 27.5304 27 27V11C27.0001 10.8686 26.9743 10.7385 26.9241 10.6172C26.8739 10.4958 26.8003 10.3854 26.7075 10.2925ZM20 6.41375L23.5863 10H20V6.41375ZM25 27H7V5H18V11C18 11.2652 18.1054 11.5196 18.2929 11.7071C18.4804 11.8946 18.7348 12 19 12H25V27ZM19.7075 17.2925C19.8004 17.3854 19.8741 17.4957 19.9244 17.6171C19.9747 17.7385 20.0006 17.8686 20.0006 18C20.0006 18.1314 19.9747 18.2615 19.9244 18.3829C19.8741 18.5043 19.8004 18.6146 19.7075 18.7075C19.6146 18.8004 19.5043 18.8741 19.3829 18.9244C19.2615 18.9747 19.1314 19.0006 19 19.0006C18.8686 19.0006 18.7385 18.9747 18.6171 18.9244C18.4957 18.8741 18.3854 18.8004 18.2925 18.7075L17 17.4137V23C17 23.2652 16.8946 23.5196 16.7071 23.7071C16.5196 23.8946 16.2652 24 16 24C15.7348 24 15.4804 23.8946 15.2929 23.7071C15.1054 23.5196 15 23.2652 15 23V17.4137L13.7075 18.7075C13.6146 18.8004 13.5043 18.8741 13.3829 18.9244C13.2615 18.9747 13.1314 19.0006 13 19.0006C12.8686 19.0006 12.7385 18.9747 12.6171 18.9244C12.4957 18.8741 12.3854 18.8004 12.2925 18.7075C12.1996 18.6146 12.1259 18.5043 12.0756 18.3829C12.0253 18.2615 11.9994 18.1314 11.9994 18C11.9994 17.8686 12.0253 17.7385 12.0756 17.6171C12.1259 17.4957 12.1996 17.3854 12.2925 17.2925L15.2925 14.2925C15.3854 14.1995 15.4957 14.1258 15.6171 14.0754C15.7385 14.0251 15.8686 13.9992 16 13.9992C16.1314 13.9992 16.2615 14.0251 16.3829 14.0754C16.5043 14.1258 16.6146 14.1995 16.7075 14.2925L19.7075 17.2925Z" />
                    </svg>
                    <svg data-rowBtn="data" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Выбрать массив данных" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 3C9.27125 3 4 6.075 4 10V22C4 25.925 9.27125 29 16 29C22.7288 29 28 25.925 28 22V10C28 6.075 22.7288 3 16 3ZM26 16C26 17.2025 25.015 18.4288 23.2987 19.365C21.3662 20.4188 18.7738 21 16 21C13.2262 21 10.6337 20.4188 8.70125 19.365C6.985 18.4288 6 17.2025 6 16V13.92C8.1325 15.795 11.7787 17 16 17C20.2213 17 23.8675 15.79 26 13.92V16ZM8.70125 6.635C10.6337 5.58125 13.2262 5 16 5C18.7738 5 21.3662 5.58125 23.2987 6.635C25.015 7.57125 26 8.7975 26 10C26 11.2025 25.015 12.4288 23.2987 13.365C21.3662 14.4187 18.7738 15 16 15C13.2262 15 10.6337 14.4187 8.70125 13.365C6.985 12.4288 6 11.2025 6 10C6 8.7975 6.985 7.57125 8.70125 6.635ZM23.2987 25.365C21.3662 26.4188 18.7738 27 16 27C13.2262 27 10.6337 26.4188 8.70125 25.365C6.985 24.4287 6 23.2025 6 22V19.92C8.1325 21.795 11.7787 23 16 23C20.2213 23 23.8675 21.79 26 19.92V22C26 23.2025 25.015 24.4287 23.2987 25.365Z" />
                    </svg>
                    <svg data-rowBtn="analytics" class="invisibility" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Аналитики" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                            <path d="M28 25H27V5C27 4.73478 26.8946 4.48043 26.7071 4.29289C26.5196 4.10536 26.2652 4 26 4H19C18.7348 4 18.4804 4.10536 18.2929 4.29289C18.1054 4.48043 18 4.73478 18 5V10H12C11.7348 10 11.4804 10.1054 11.2929 10.2929C11.1054 10.4804 11 10.7348 11 11V16H6C5.73478 16 5.48043 16.1054 5.29289 16.2929C5.10536 16.4804 5 16.7348 5 17V25H4C3.73478 25 3.48043 25.1054 3.29289 25.2929C3.10536 25.4804 3 25.7348 3 26C3 26.2652 3.10536 26.5196 3.29289 26.7071C3.48043 26.8946 3.73478 27 4 27H28C28.2652 27 28.5196 26.8946 28.7071 26.7071C28.8946 26.5196 29 26.2652 29 26C29 25.7348 28.8946 25.4804 28.7071 25.2929C28.5196 25.1054 28.2652 25 28 25ZM20 6H25V25H20V6ZM13 12H18V25H13V12ZM7 18H11V25H7V18Z" />
                    </svg>
                    <div class="">
                        <div mode="view" class="hidden" style="display:flex; gap: 0.5rem; align-items: center;">
                            <svg data-rowBtn="editeRow" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Редактировать" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                                <path d="M28.415 9.17125L22.8288 3.58625C22.643 3.40049 22.4225 3.25313 22.1799 3.15259C21.9372 3.05205 21.6771 3.00031 21.4144 3.00031C21.1517 3.00031 20.8916 3.05205 20.6489 3.15259C20.4062 3.25313 20.1857 3.40049 20 3.58625L4.58626 19C4.39973 19.185 4.25185 19.4053 4.15121 19.648C4.05057 19.8907 3.99917 20.151 4.00001 20.4138V26C4.00001 26.5304 4.21072 27.0391 4.5858 27.4142C4.96087 27.7893 5.46958 28 6.00001 28H27C27.2652 28 27.5196 27.8946 27.7071 27.7071C27.8947 27.5196 28 27.2652 28 27C28 26.7348 27.8947 26.4804 27.7071 26.2929C27.5196 26.1054 27.2652 26 27 26H14.415L28.415 12C28.6008 11.8143 28.7481 11.5938 28.8487 11.3511C28.9492 11.1084 29.001 10.8483 29.001 10.5856C29.001 10.3229 28.9492 10.0628 28.8487 9.82016C28.7481 9.57747 28.6008 9.35698 28.415 9.17125ZM11.5863 26H6.00001V20.4138L17 9.41375L22.5863 15L11.5863 26ZM24 13.5863L18.415 8L21.415 5L27 10.5863L24 13.5863Z" />
                            </svg>
                        </div>
                        <div mode="editor" style="display:flex; gap: 0.5rem; align-items: center;">
                            <svg data-rowBtn="save" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Сохранить" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                                <path d="M28.7074 9.70751L12.7074 25.7075C12.6146 25.8005 12.5043 25.8742 12.3829 25.9246C12.2615 25.9749 12.1314 26.0008 11.9999 26.0008C11.8685 26.0008 11.7384 25.9749 11.617 25.9246C11.4956 25.8742 11.3853 25.8005 11.2924 25.7075L4.29245 18.7075C4.1048 18.5199 3.99939 18.2654 3.99939 18C3.99939 17.7346 4.1048 17.4801 4.29245 17.2925C4.48009 17.1049 4.73458 16.9994 4.99995 16.9994C5.26531 16.9994 5.5198 17.1049 5.70745 17.2925L11.9999 23.5863L27.2924 8.29251C27.4801 8.10487 27.7346 7.99945 27.9999 7.99945C28.2653 7.99945 28.5198 8.10487 28.7074 8.29251C28.8951 8.48015 29.0005 8.73464 29.0005 9.00001C29.0005 9.26537 28.8951 9.51987 28.7074 9.70751Z" />
                            </svg>
                        </div>
                    </div>
                    <svg data-rowBtn="removeRow" fill="#aa1212" style="cursor: pointer;" tooltipe="Удалить показатель" width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M27 6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM24 26H8V8H24V26ZM10 3C10 2.73478 10.1054 2.48043 10.2929 2.29289C10.4804 2.10536 10.7348 2 11 2H21C21.2652 2 21.5196 2.10536 21.7071 2.29289C21.8946 2.48043 22 2.73478 22 3C22 3.26522 21.8946 3.51957 21.7071 3.70711C21.5196 3.89464 21.2652 4 21 4H11C10.7348 4 10.4804 3.89464 10.2929 3.70711C10.1054 3.51957 10 3.26522 10 3Z" />
                    </svg>
                </div>
            </div>
        </li>`);
}

export function getOutputTemplate(){
    return $(`
        <li class="ListRow" isActive="false">
            <div class="RowItem RowInlineContent LongItem" field="Number" style="border:unset;">
                <div mode="view" class="hidden">
                    <span class="RowItemName">0</span> 
                </div>
                <div mode="editor">
                    <span class="RowItemName">0</span> 
                </div>
            </div>
            <div class="RowItem RowInlineContent LongItem" field="Indicator" style="border:unset;">
                <span class="RowItemName hidden" mode="view"></span>
                <div mode="editor" style="display: flex; gap: 0.5rem; align-items: center;">
                    <label class="dropdown">
                        <select class="indicator"></select>
                        <svg width="18" height="18" viewBox="0 0 32 32" fill="#004C97"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M26.7074 12.7075L16.7074 22.7075C16.6146 22.8005 16.5043 22.8742 16.3829 22.9246C16.2615 22.9749 16.1314 23.0008 15.9999 23.0008C15.8685 23.0008 15.7384 22.9749 15.617 22.9246C15.4956 22.8742 15.3853 22.8005 15.2924 22.7075L5.29245 12.7075C5.1048 12.5199 4.99939 12.2654 4.99939 12C4.99939 11.7346 5.1048 11.4801 5.29245 11.2925C5.48009 11.1049 5.73458 10.9995 5.99995 10.9995C6.26531 10.9995 6.5198 11.1049 6.70745 11.2925L15.9999 20.5863L25.2924 11.2925C25.3854 11.1996 25.4957 11.1259 25.6171 11.0756C25.7384 11.0253 25.8686 10.9995 25.9999 10.9995C26.1313 10.9995 26.2614 11.0253 26.3828 11.0756C26.5042 11.1259 26.6145 11.1996 26.7074 11.2925C26.8004 11.3854 26.8741 11.4957 26.9243 11.6171C26.9746 11.7385 27.0005 11.8686 27.0005 12C27.0005 12.1314 26.9746 12.2615 26.9243 12.3829C26.8741 12.5043 26.8004 12.6146 26.7074 12.7075Z" />
                        </svg>
                    </label>
                    <svg data-rowBtn="filteringIndicator" width="24" height="24" style="cursor: pointer;" tooltipe="Фильтр" fill="#004c97" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M28.825 6.19125C28.6711 5.83564 28.4161 5.53312 28.0916 5.32132C27.7671 5.10952 27.3875 4.99778 27 5H5.00003C4.61294 5.00076 4.23439 5.11384 3.91031 5.32551C3.58622 5.53718 3.33053 5.83835 3.17424 6.19248C3.01795 6.54661 2.96778 6.93849 3.02983 7.32057C3.09187 7.70265 3.26346 8.05852 3.52378 8.345L3.53378 8.35625L12 17.3963V27C11.9999 27.362 12.0981 27.7172 12.284 28.0278C12.4699 28.3383 12.7367 28.5926 13.0558 28.7635C13.3749 28.9344 13.7343 29.0155 14.0959 28.9982C14.4574 28.9808 14.8075 28.8657 15.1088 28.665L19.1088 25.9975C19.383 25.8149 19.6078 25.5673 19.7633 25.2768C19.9188 24.9864 20.0001 24.662 20 24.3325V17.3963L28.4675 8.35625L28.4775 8.345C28.7406 8.05983 28.9138 7.70349 28.9756 7.32046C29.0374 6.93744 28.9851 6.54469 28.825 6.19125ZM18.5425 16.035C18.1951 16.4032 18.0011 16.89 18 17.3963V24.3325L14 27V17.3963C14.0012 16.8882 13.808 16.3989 13.46 16.0288L5.00003 7H27L18.5425 16.035Z" />
                    </svg>
                </div>
            </div>
            <div class="RowItem RowInlineContent " field="Product" style="border:unset;">
                <span class="RowItemName hidden" mode="view"></span>
                <span class="RowItemName" mode="editor"></span>
            </div>
            <div class="RowItem RowInlineContent" style="border:unset;">
                <div style="margin-left: auto; display:flex; gap: 0.5rem; align-items: center;">
                    <svg data-rowBtn="analytics" class="invisibility" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Аналитики" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                            <path d="M28 25H27V5C27 4.73478 26.8946 4.48043 26.7071 4.29289C26.5196 4.10536 26.2652 4 26 4H19C18.7348 4 18.4804 4.10536 18.2929 4.29289C18.1054 4.48043 18 4.73478 18 5V10H12C11.7348 10 11.4804 10.1054 11.2929 10.2929C11.1054 10.4804 11 10.7348 11 11V16H6C5.73478 16 5.48043 16.1054 5.29289 16.2929C5.10536 16.4804 5 16.7348 5 17V25H4C3.73478 25 3.48043 25.1054 3.29289 25.2929C3.10536 25.4804 3 25.7348 3 26C3 26.2652 3.10536 26.5196 3.29289 26.7071C3.48043 26.8946 3.73478 27 4 27H28C28.2652 27 28.5196 26.8946 28.7071 26.7071C28.8946 26.5196 29 26.2652 29 26C29 25.7348 28.8946 25.4804 28.7071 25.2929C28.5196 25.1054 28.2652 25 28 25ZM20 6H25V25H20V6ZM13 12H18V25H13V12ZM7 18H11V25H7V18Z" />
                    </svg>
                    <div class="Rectangle1" style="width: 2px; height: 20px; background: #ccd0d4; border-radius: 10px"></div>
                    <div class="">
                        <div mode="view" class="hidden" style="display:flex; gap: 0.5rem; align-items: center;">
                            <svg data-rowBtn="editeRow" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Редактировать" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                                <path d="M28.415 9.17125L22.8288 3.58625C22.643 3.40049 22.4225 3.25313 22.1799 3.15259C21.9372 3.05205 21.6771 3.00031 21.4144 3.00031C21.1517 3.00031 20.8916 3.05205 20.6489 3.15259C20.4062 3.25313 20.1857 3.40049 20 3.58625L4.58626 19C4.39973 19.185 4.25185 19.4053 4.15121 19.648C4.05057 19.8907 3.99917 20.151 4.00001 20.4138V26C4.00001 26.5304 4.21072 27.0391 4.5858 27.4142C4.96087 27.7893 5.46958 28 6.00001 28H27C27.2652 28 27.5196 27.8946 27.7071 27.7071C27.8947 27.5196 28 27.2652 28 27C28 26.7348 27.8947 26.4804 27.7071 26.2929C27.5196 26.1054 27.2652 26 27 26H14.415L28.415 12C28.6008 11.8143 28.7481 11.5938 28.8487 11.3511C28.9492 11.1084 29.001 10.8483 29.001 10.5856C29.001 10.3229 28.9492 10.0628 28.8487 9.82016C28.7481 9.57747 28.6008 9.35698 28.415 9.17125ZM11.5863 26H6.00001V20.4138L17 9.41375L22.5863 15L11.5863 26ZM24 13.5863L18.415 8L21.415 5L27 10.5863L24 13.5863Z" />
                            </svg>
                        </div>
                        <div mode="editor" style="display:flex; gap: 0.5rem; align-items: center;">
                            <svg data-rowBtn="cancel" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Сохранить" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                                <path d="M28.7074 9.70751L12.7074 25.7075C12.6146 25.8005 12.5043 25.8742 12.3829 25.9246C12.2615 25.9749 12.1314 26.0008 11.9999 26.0008C11.8685 26.0008 11.7384 25.9749 11.617 25.9246C11.4956 25.8742 11.3853 25.8005 11.2924 25.7075L4.29245 18.7075C4.1048 18.5199 3.99939 18.2654 3.99939 18C3.99939 17.7346 4.1048 17.4801 4.29245 17.2925C4.48009 17.1049 4.73458 16.9994 4.99995 16.9994C5.26531 16.9994 5.5198 17.1049 5.70745 17.2925L11.9999 23.5863L27.2924 8.29251C27.4801 8.10487 27.7346 7.99945 27.9999 7.99945C28.2653 7.99945 28.5198 8.10487 28.7074 8.29251C28.8951 8.48015 29.0005 8.73464 29.0005 9.00001C29.0005 9.26537 28.8951 9.51987 28.7074 9.70751Z" />
                            </svg>
                        </div>
                    </div>
                    <div class="Rectangle1" style="width: 2px; height: 20px; background: #ccd0d4; border-radius: 10px"></div>
                    <svg data-rowBtn="removeRow" fill="#aa1212" style="cursor: pointer;" tooltipe="Удалить показатель" width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M27 6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM24 26H8V8H24V26ZM10 3C10 2.73478 10.1054 2.48043 10.2929 2.29289C10.4804 2.10536 10.7348 2 11 2H21C21.2652 2 21.5196 2.10536 21.7071 2.29289C21.8946 2.48043 22 2.73478 22 3C22 3.26522 21.8946 3.51957 21.7071 3.70711C21.5196 3.89464 21.2652 4 21 4H11C10.7348 4 10.4804 3.89464 10.2929 3.70711C10.1054 3.51957 10 3.26522 10 3Z" />
                    </svg>
                </div>
            </div>
        </li>`);
}

export function GoToJournal(type) { // 1 - Стресс, 2 - Прогноз
    const root = window.parent.location.href.split('#')[0];
    window.parent.location.href = root + '#/app/navigator?key=1148284' +  `&journalType=${type}`;//document.location.href.replace("PrognozConf", "Journal").replace("StressConf", "Journal") + `&journalType=${type}`;
}

export function OpenDimCombo(dimKey, divId, _params, onselectionChange, isMultiSelect, onLoad) {
    return window.OpenDimCombo(dimKey, divId, _params, onselectionChange, isMultiSelect, onLoad);
}

export function parseDate(dateStr){
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length !== 3) {
        const month = parseInt(parts[0], 10) - 1; // Месяцы в JS начинаются с 0
        const year = parseInt(parts[1], 10);
        return new Date(year, month, 1);
    }else{
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Месяцы в JS начинаются с 0
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
}

export function initSelect2Event($el){
    
    $el.on('select2:open', function(e) {
        const $input = $(this);
        const $parent = $input.closest('.dropdown')
        const $dropdownBtn = $parent.find('svg');
        if($dropdownBtn.length > 0){
            $dropdownBtn.css('transform', 'rotate(180deg)');
        }
    });

    $el.on('select2:select', function(e) {
        if ($(this).val().length >= 1) {
            $(this).next('.select2-container').find('.select2-search--inline').hide();
        }
    });

    $el.on('select2:close', function(e) {
        const $input = $(this);
        const $parent = $input.closest('.dropdown')
        const $dropdownBtn = $parent.find('svg');
        if ($(this).val().length >= 1) {
            $(this).next('.select2-container').find('.select2-search--inline').hide();
        }
        if($dropdownBtn.length > 0){
            $dropdownBtn.css('transform', 'rotate(0deg)');
        }
    });

    $el.on('select2:unselect', function(e) {
        // Восстанавливаем строку поиска при удалении элемента
        if ($(this).val().length < 1) {
            $(this).next('.select2-container').find('.select2-search--inline').show();
        }
    });
}

// Для страниц, подключающих модуль (например AlgUtils.html): экспорт getJsonFromUrl в window для обратной совместимости
if (typeof window !== 'undefined') {
    window.getJsonFromUrl = getJsonFromUrl;
}