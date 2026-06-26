import { formatState, formatSelected, formatDistribution, initSelect2Event, OpenDimCombo } from './utils.js';
import { StressModes, StressValidationMessages } from './constants.js';

/** CustomePopUp - кастомный попап для распределения/фильтра. Используются глобальные переменные: Dims, bi */
export class CustomePopUp {
    constructor(stress) {
        this.stress = stress;
    }

    init($el, data, selected, mode, $nav){
        if(mode === StressModes.ADD_NEW_DISTRIBUTION){
            const indicatorTypeEl = $('[name="parameterType"]:checked');
            let indicatorType = 1;

            if(indicatorTypeEl.length > 0){
                indicatorType = Number(indicatorTypeEl.attr('typeId'));
            }
            const filterData = this.stress.distributionEls.find(item => item.type === indicatorType);

            const selectableParameters = filterData.data.filter(item => item.ea.it["6"]["@v"] === "1");
            selected = this.getUnselectedItems(selectableParameters , selected);
        }else if(mode === StressModes.SEARCH_DISTRIBUTION){
            const newArray = [];

            data.results.forEach(item => {
                const isSelected = selected.find(item2 => item2.name.toLowerCase() === item.dist_type.toLowerCase())
                if(isSelected !== undefined){

                    newArray.push(item);
                }
            })

            data.unable_to_fit.forEach(item => {
                const isSelected = selected.find(item2 => item2.name.toLowerCase() === item.dist_type.toLowerCase())
                if(isSelected !== undefined){
                    const newitem = {
                        "key": item.key,
                        "dist_type": item.dist_type,
                        "info_criteria": {
                            "AIC": "x",
                            "HQIC": "x",
                            "LR": "x",
                            "SIC": "x",
                        },
                        "params": {
                        },
                        "status": "unable_to_fit",
                        "error": item.error,
                    };
                    newArray.push(newitem);
                }
            })

            selected = newArray;
        }else{
            selected = data;
        }

        this.render($el, selected, mode, $nav)
    }

    getUnselectedItems(data, selected){
        // Преобразуем массив selected в Set для более эффективного поиска
        const selectedNames = new Set(selected.map(item => item.name));

        // Фильтруем data, оставляя только те элементы, которых нет в selected
        const unselected = data.filter(item => !selectedNames.has(item.n));

        return unselected;
    }

    render($el, selected, mode, $nav){
        const self = this;
        const $popUp = $(`<div class="custom-popup">
            <div class="custom-popup__body"></div>
            </div>`);

        const $popUpBody = $popUp.find('.custom-popup__body');
        // Удаляем старый popup если есть
        $nav.find('.custom-popup').remove();

        // Получаем позицию элемента относительно документа
        const elPosition = $el.position();
        const elWidth = $el[0].getBBox().width; //$el.outerWidth();
        const offsetRight = 24;

        if(mode === StressModes.ADD_NEW_DISTRIBUTION){
            const left = (elPosition.left - elWidth - offsetRight);
            $popUp.css({
                'top': '2.125rem',
                'left': left + 'px',
                });
            const $searchInput = $(`<input type="text" class="custom-popup__input" placeholder="Найти" />`);

            $searchInput.on('input', (el) =>{
                const $input = $(el.currentTarget);
                const val = $input.val();
                const $parent = $input.closest('.custom-popup');
                const $body = $parent.find('.custom-popup__body');

                // clear old Items
                $body.empty();

                // fill new Items
                if(val !== ""){
                    self.createAddItemDistribution(selected.filter(item => item.n.toLowerCase().includes(val.toLowerCase())), $body);
                }else{
                    self.createAddItemDistribution(selected, $body);
                }
            });

            $popUp.prepend($searchInput);
            // Заполняем Body
            self.createAddItemDistribution(selected, $popUpBody);
        }else if(mode === StressModes.SEARCH_DISTRIBUTION){
            const left = (elPosition.left - elWidth - offsetRight);
            $popUp.css({
                'top': '2.125rem',
                'left': left + 'px',
                });

            // Заполняем Body
            self.createSearchItemDistribution(selected, $popUpBody, $el)
        }else if(mode === StressModes.FILTERING_INDICATOR_INPUT){

            const left = (elPosition.left - elWidth - offsetRight);
            $popUp.css({
                'top': (elPosition.top + offsetRight) + 'px',
                'left': left + 'px',
                });
            const $searchInput = $(`<input type="text" class="custom-popup__input" placeholder="Найти" />`);

            $searchInput.on('input', (el) =>{
                const $input = $(el.currentTarget);
                const val = $input.val();
                const $parent = $input.closest('.custom-popup');
                const $body = $parent.find('.custom-popup__body');

                // clear old Items
                $body.empty();
                // fill new Items
                if(val !== ""){
                    self.createfilteringIndicatorInput(selected.filter(item => item.text.toLowerCase().includes(val.toLowerCase())), $body, $el);
                }else{
                    self.createfilteringIndicatorInput(selected, $body, $el);
                }
            });

            $popUp.prepend($searchInput);

            // Заполняем Body
            self.createfilteringIndicatorInput(selected, $popUpBody, $el)
        }else if(mode === StressModes.FILTERING_INDICATOR_OUTPUT){

            const left = (elPosition.left - elWidth - offsetRight);
            $popUp.css({
                'top': (elPosition.top + offsetRight) + 'px',
                'left': left + 'px',
                });
            const $searchOutput = $(`<input type="text" class="custom-popup__input" placeholder="Найти" />`);

            $searchOutput.on('input', (el) =>{
                const $input = $(el.currentTarget);
                const val = $input.val();
                const $parent = $input.closest('.custom-popup');
                const $body = $parent.find('.custom-popup__body');

                // clear old Items
                $body.empty();
                // fill new Items
                if(val !== ""){
                    self.createfilteringIndicatorOutput(selected.filter(item => item.text.toLowerCase().includes(val.toLowerCase())), $body, $el);
                }else{
                    self.createfilteringIndicatorOutput(selected, $body, $el);
                }
            });

            $popUp.prepend($searchOutput);

            // Заполняем Body
            self.createfilteringIndicatorOutput(selected, $popUpBody, $el)
        }else if(mode === StressModes.FILTERING_DISTRIBUTION_INPUT){

            const left = (elPosition.left - elWidth - offsetRight);
            $popUp.css({
                'top': (elPosition.top + offsetRight) + 'px',
                'left': left + 'px',
                });
            const $searchInput = $(`<input type="text" class="custom-popup__input" placeholder="Найти" />`);

            $searchInput.on('input', (el) =>{
                const $input = $(el.currentTarget);
                const val = $input.val();
                const $parent = $input.closest('.custom-popup');
                const $body = $parent.find('.custom-popup__body');

                // clear old Items
                $body.empty();
                // fill new Items
                if(val !== ""){
                    self.createfilteringDistributionInput(selected.filter(item => item.text.toLowerCase().includes(val.toLowerCase())), $body, $el);
                }else{
                    self.createfilteringDistributionInput(selected, $body, $el);
                }
            });

            $popUp.prepend($searchInput);

            // Заполняем Body
            self.createfilteringDistributionInput(selected, $popUpBody, $el)
        }else if(mode.includes('filteringInputItems')){
            const left = (elPosition.left - elWidth - offsetRight);
            $popUp.css({
                'top': '2.125rem',
                'left': left + 'px',
                });
            // Заполняем Body
            const $searchInput = $(`<input type="text" class="custom-popup__input" placeholder="Найти" />`);

            $searchInput.on('input', (el) =>{
                const $input = $(el.currentTarget);
                const val = $input.val();
                const $parent = $input.closest('.custom-popup');
                const $body = $parent.find('.custom-popup__body');
                // clear old Items
                $body.empty();
                // fill new Items
                if(val !== ""){
                    let data = [];
                    if(mode === StressModes.FILTERING_INPUT_ITEMS_NUMBER){
                        data = selected.filter(item => item.number.toString() === val)
                    }else if(mode === StressModes.FILTERING_INPUT_ITEMS_NAME || mode === StressModes.FILTERING_INPUT_ITEMS_PRODUCT){
                        data = selected.filter(item => item.indicatorName.toLowerCase().includes(val.toLowerCase()))
                    }
                    self.createSerachInputItems(data, $body, mode, $el);
                }else{
                    self.createSerachInputItems(selected, $body, mode, $el);
                }

            });

            $popUp.prepend($searchInput);

            self.createSerachInputItems(selected, $popUpBody, mode, $el)

        }else if(mode.includes('filteringOutputItems')){
            const left = (elPosition.left - elWidth - offsetRight);
            $popUp.css({
                'top': '2.125rem',
                'left': left + 'px',
                });
            // Заполняем Body
            const $searchInput = $(`<input type="text" class="custom-popup__input" placeholder="Найти" />`);

            $searchInput.on('input', (el) =>{
                const $input = $(el.currentTarget);
                const val = $input.val();
                const $parent = $input.closest('.custom-popup');
                const $body = $parent.find('.custom-popup__body');
                // clear old Items
                $body.empty();
                // fill new Items
                if(val !== ""){
                    let data = [];
                    if(mode === StressModes.FILTERING_OUTPUT_ITEMS_NUMBER){
                        data = selected.filter(item => item.number.toString() === val)
                    }else if(mode === StressModes.FILTERING_OUTPUT_ITEMS_NAME|| mode === StressModes.FILTERING_OUTPUT_ITEMS_PRODUCT){
                        data = selected.filter(item => item.indicatorName.toLowerCase().includes(val.toLowerCase()))
                    }
                    self.createSerachOutputItems(data, $body, mode, $el);
                }else{
                    self.createSerachOutputItems(selected, $body, mode, $el);
                }

            });

            $popUp.prepend($searchInput);

            self.createSerachOutputItems(selected, $popUpBody, mode, $el)
        }

        $nav.append($popUp);

        // Функция проверки клика вне области
        function handleClickOutside(event) {
            // Проверяем, что клик был не по элементу и не по popup
            if (!$el.is(event.target) && $el.has(event.target).length === 0 &&
                !$popUp.is(event.target) && $popUp.has(event.target).length === 0) {

                // Удаляем popup
                $popUp.remove();

                // Удаляем обработчик события
                $(document).off('click', handleClickOutside);
            }
        }

        // Добавляем обработчик клика по документу
        // Используем setTimeout, чтобы текущий клик не триггерил удаление
        setTimeout(() => {
            $(document).on('click', handleClickOutside);
        }, 0);
    }

    createAddItemDistribution(items, $body){
        items.forEach(item => {

            const $item = $(`<div class="custom-popup__item">
                    <img class="custom-popup__img" src="img/distribution/${item.n}.svg" />
                    <p class="custom-popup__text">${item.n}</p>
                </div>`);

            $item.on('click', (el) =>{
                const name = $(el.currentTarget).find('.custom-popup__text').text();
                const combinedData = this.stress.distributionEls.flatMap(item => item.data);
                const selectedItem = combinedData.find(prop => prop.n === name);
                const countRow = $('#SelectDistributionGrid tbody tr').length;

                if(selectedItem !== undefined){
                    let index = 0;
                    if(countRow > 0){
                        index += 1;
                    }

                    const item2 = {
                        "key": selectedItem.k,
                        "dist_type": selectedItem.n,
                        "info_criteria": {
                            "AIC": "-",
                            "HQIC": "-",
                            "LR": "-",
                            "SIC": "-",
                        },
                        "params": {
                            "p": 1,
                        },
                        "getParamFromRequest": true,
                    };
                    this.stress.InputSelectDistribution.distributionObj.results.push(item2);
                    this.stress.InputSelectDistribution.renderRow(item2, index, "new");

                    $item.remove();
                }else{
                    this.stress.common.showDialog(StressValidationMessages.SOMETHING_WENT_WRONG);
                }
            });

            $body.append($item);
        })
    }

    createSearchItemDistribution(items, $body, $btn){
        const oldSelected = $btn.attr('data-selected');
        items.forEach(res => {
            const $item = $(`<div class="custom-popup__item" ${oldSelected !== undefined && oldSelected.toLowerCase() === res.dist_type.toString().toLowerCase() ? `style="background: #004c97; color:#fff;"`: ``}>
                <p class="custom-popup__text">${res.dist_type}</p>
            </div>`);

            $item.on('click', (el) =>{
                const name = $(el.currentTarget).find('.custom-popup__text').text();

                if($btn.length > 0){
                    let color = '#004c97'; // - default color
                    let textInfo = 'Фильтр'; // - default text info

                    if(name !== "Все"){
                        color = '#00972e'
                        textInfo = name;
                        $btn.attr('data-selected', name)
                    }else{
                        $btn.removeAttr('data-selected')
                    }

                    $btn.css('fill', color);

                    if($btn[0]._tippy !== undefined){
                        $btn[0]._tippy.setProps({
                            content: '<p class="tooltipe__text">' + textInfo + '</p>'
                        })
                    }

                }

                $('.custom-popup').remove();
                const $tableBody = $("#SelectDistributionGrid tbody")
                const $rows = $tableBody.find('tr[distribution="'+ name +'"]');

                // Перемещаем строку в начало
                $rows.each(function() {
                    $tableBody.prepend(this);
                });
            });

            $body.append($item);
        })
    }

    createfilteringIndicatorInput(items, $body, $btn){
        const oldSelected = $btn.attr('data-selected');
        items.forEach(res => {
            const value = res.text.split('#;');
            const $item = $(`<div class="custom-popup__item" ${oldSelected !== undefined && oldSelected.toLowerCase() === value[1].toString().toLowerCase() ? `style="background: #004c97; color:#fff;"`: ``}>
                <p class="custom-popup__text" id="${value[0]}">${value[1]}</p>
            </div>`);

            $item.on('click', (el) =>{

                const $textEl = $(el.currentTarget).find('.custom-popup__text');
                const id = $textEl.attr('id');
                const name = $textEl.text();

                if($btn.length > 0){
                    let color = '#004c97'; // - default color
                    let textInfo = 'Фильтр'; // - default text info

                    if(name !== "Все"){
                        color = '#00972e'
                        textInfo = name;
                        $btn.attr('data-selected', name)
                    }else{
                        $btn.removeAttr('data-selected')
                    }

                    $btn.css('fill', color);

                    if($btn[0]._tippy !== undefined){
                        $btn[0]._tippy.setProps({
                            content: '<p class="tooltipe__text">' + textInfo + '</p>'
                        })
                    }

                }

                const stress = this.stress;
                const _params = [
                    { Id: "IND_TYPE", Value: 1, Type: stress.bi.ItDataType.Integer },
                    { Id: "BLOCK_ID", Value: Number(id), Type: stress.bi.ItDataType.Integer }
                ]
                const $parent = $btn.closest('.ListRow');
                const $indicator = $parent.length ? $parent.find('[field="Indicator"] .indicator') : $(el.currentTarget).closest('.ListRow').find('[field="Indicator"] .indicator');
                const combo = stress.openDimCombo(stress.Dims.STRESS_POKS, null, _params, null, true, (x) => {
                    stress.bi.getFiltredDimElements({ "key": combo.dim.getOdId().id }).then(data => this.applyIndicatorOptionsFromData(data, $indicator));
                });
            });

            $body.append($item);
        })
    }

    createfilteringIndicatorOutput(items, $body, $btn){
        const oldSelected = $btn.attr('data-selected');
        items.forEach(res => {
            const value = res.text.split('#;');
            const $item = $(`<div class="custom-popup__item" ${oldSelected !== undefined && oldSelected.toLowerCase() === value[1].toString().toLowerCase() ? `style="background: #004c97; color:#fff;"`: ``}>
                <p class="custom-popup__text" id="${value[0]}">${value[1]}</p>
            </div>`);
            $item.on('click', (el) =>{
                const $textEl = $(el.currentTarget).find('.custom-popup__text');
                const id = $textEl.attr('id');
                const name = $textEl.text();

                if($btn.length > 0){
                    let color = '#004c97'; // - default color
                    let textInfo = 'Фильтр'; // - default text info

                    if(name !== "Все"){
                        color = '#00972e'
                        textInfo = name;
                        $btn.attr('data-selected', name)
                    }else{
                        $btn.removeAttr('data-selected')
                    }

                    $btn.css('fill', color);

                    if($btn[0]._tippy !== undefined){
                        $btn[0]._tippy.setProps({
                            content: '<p class="tooltipe__text">' + textInfo + '</p>'
                        })
                    }

                }

                const stress = this.stress;
                const _params = [
                    { Id: "IND_TYPE", Value: 2, Type: stress.bi.ItDataType.Integer },
                    { Id: "BLOCK_ID", Value: Number(id), Type: stress.bi.ItDataType.Integer }
                ]
                const $parentOutput = $(el.currentTarget).closest('.ListRow');
                const $indicatorOutput = $parentOutput.find('[field="Indicator"] .indicator');
                const combo = stress.openDimCombo(stress.Dims.STRESS_POKS, null, _params, null, true, (x) => {
                    stress.bi.getFiltredDimElements({ "key": combo.dim.getOdId().id }).then(data => this.applyIndicatorOptionsFromData(data, $indicatorOutput));
                });
            });

            $body.append($item);
        })
    }

    /**
     * Обработчик данных getFiltredDimElements для индикатора: заполнение select2 и закрытие popup.
     */
    applyIndicatorOptionsFromData(data, $indicator) {
        let res = [];
        if (data !== undefined) {
            res = data.map((item) => ({
                id: item.k,
                text: item.k + "#;" + item.n
            }));
        }
        $indicator.empty().select2({
            data: res,
            templateResult: formatState,
            templateSelection: formatSelected,
            width: '120px',
            dropdownAutoWidth: false,
            placeholder: '',
            multiple: true,
            allowClear: true,
            maximumSelectionLength: 1,
            language: {
                noResults: function () { return "Ничего не найдено"; },
                maximumSelected: function (args) {
                    return args.maximum > 1 ? "Можно выбрать только " + args.maximum + " элемента" : "Можно выбрать только 1 элемент";
                }
            },
            adaptDropdownCssClass: function () { return ''; },
            matcher: function (params, data) {
                if ($.trim(params.term) === '') return data;
                const parts = data.text.split(';');
                const valuePart = parts.length > 1 ? parts[1] : parts[0];
                return valuePart.toUpperCase().indexOf(params.term.toUpperCase()) >= 0 ? data : null;
            },
        });
        $('.custom-popup').remove();
    }

    createfilteringDistributionInput(items, $body, $btn){
        const oldSelected = $btn.attr('data-selected');
        items.forEach(res => {
            const $item = $(`<div class="custom-popup__item" ${oldSelected !== undefined && oldSelected.toLowerCase() === res.name.toString().toLowerCase() ? `style="background: #004c97; color:#fff;"`: ``}>
                <p class="custom-popup__text" id="${res.id}">${res.name}</p>
            </div>`);

            $item.on('click', (el) =>{
                const $textEl = $(el.currentTarget).find('.custom-popup__text');
                const id = Number($textEl.attr('id'));
                const name = $textEl.text();

                if($btn.length > 0){
                    let color = '#004c97'; // - default color
                    let textInfo = 'Фильтр'; // - default text info

                    if(name !== "Все"){
                        color = '#00972e'
                        textInfo = name;
                        $btn.attr('data-selected', name)
                    }else{
                        $btn.removeAttr('data-selected')
                    }

                    $btn.css('fill', color);

                    if($btn[0]._tippy !== undefined){
                        $btn[0]._tippy.setProps({
                            content: '<p class="tooltipe__text">' + textInfo + '</p>'
                        })
                    }

                }

                let data = [];
                if(id === 0){
                    data = this.stress.distributionEls.flatMap(item => item.data);
                }else{
                    const dataType = this.stress.distributionEls.find(item => item.type === id);
                    if(dataType !== undefined){
                        data = dataType.data;
                    }
                }

                let newData = [];
                if(data !== undefined){
                    newData = data.map((item) => ({
                        id: item.k,
                        text: item.k + "#;"+ item.n
                    }));
                }

                const $parent = $btn.closest('.ListRow');
                const $distribution = $parent.length ? $parent.find('[field="Distribution"] .distribution') : $(el.currentTarget).closest('.ListRow').find('[field="Distribution"] .distribution');

                $distribution.empty().select2({
                    data: newData,
                    templateResult: formatDistribution,
                    templateSelection: formatSelected,
                    width : '120px',
                    dropdownAutoWidth: false,
                    placeholder: '',
                    multiple: true,
                    allowClear: true,
                    maximumSelectionLength: 1,
                    language: {
                        noResults: function() {
                            return "Ничего не найдено";
                        },
                        maximumSelected: function (args) {
                            if(args.maximum > 1){
                                return "Можно выбрать только " + args.maximum + " элемента";
                            }else{
                                return "Можно выбрать только 1 элемент";
                            }
                        }
                    },
                    adaptDropdownCssClass: function() {
                        return ''; // Отключаем CSS-классы, которые могут добавлять title
                    },
                    matcher: function(params, data) {
                        // Если поисковой запрос пуст, показываем все элементы
                        if ($.trim(params.term) === '') {
                          return data;
                        }

                        // Разделяем текст на ID и значение
                        var parts = data.text.split(';');
                        var valuePart = parts.length > 1 ? parts[1] : parts[0];

                        // Ищем только в части значения (после ;)
                        if (valuePart.toUpperCase().indexOf(params.term.toUpperCase()) >= 0) {
                          return data;
                        }

                        // Если не найдено, возвращаем null
                        return null;
                    },
                });

                // Удаляем popup
                $('.custom-popup').remove();

            });

            $body.append($item);
        })
    }

    createSerachInputItems(items, $body, mode, $btn){
        const oldSelected = $btn.attr('data-selected');
        items.forEach(res => {

            let nameRow;
            if(mode === StressModes.FILTERING_INPUT_ITEMS_NUMBER){
                nameRow = res.number;
            }else if(mode === StressModes.FILTERING_INPUT_ITEMS_NAME || mode === StressModes.FILTERING_INPUT_ITEMS_PRODUCT){
                nameRow = res.indicatorName;
            }
            const $item = $(`<div class="custom-popup__item" ${oldSelected !== undefined && oldSelected.toLowerCase() === nameRow.toString().toLowerCase() ? `style="background: #004c97; color:#fff;"`: ``}>
                <p class="custom-popup__text">${nameRow}</p>
            </div>`);

            $item.on('click', (el) => {
                const $el = $(el.currentTarget);
                const name = $el.find('.custom-popup__text').text();

                const $parent = $('#input_block_list');
                const $oldInput = $parent.find('.hidden__row');

                if($btn.length > 0){
                    let color = '#004c97'; // - default color
                    let textInfo = 'Фильтр'; // - default text info

                    if(name !== "Все"){
                        color = '#00972e'
                        textInfo = name;
                        $btn.attr('data-selected', name)
                    }else{
                        $btn.removeAttr('data-selected')
                    }

                    $btn.css('fill', color);

                    if($btn[0]._tippy !== undefined){
                        $btn[0]._tippy.setProps({
                            content: '<p class="tooltipe__text">' + textInfo + '</p>'
                        })
                    }

                }

                if($oldInput.length > 0){
                    $oldInput.removeClass('hidden__row');
                }

                let $input = null;
                if(name !== "Все"){
                    if(mode === StressModes.FILTERING_INPUT_ITEMS_NUMBER){
                        $parent.find('[row-id]').addClass('hidden__row');
                        $input = $parent.find('[row-id="'+ name +'"]');
                    } else if(mode === StressModes.FILTERING_INPUT_ITEMS_NAME){
                        $parent.find('[row-id]').addClass('hidden__row');
                        const $text = $parent.find('[field="Indicator"] [mode="view"]:contains("'+ name +'")');
                        $input = $text.closest('[row-id]');
                    } else if(mode === StressModes.FILTERING_INPUT_ITEMS_PRODUCT){
                        $parent.find('[row-id]').addClass('hidden__row');
                        const $text = $parent.find('[field="Product"] [mode="view"]:contains("'+ name +'")');
                        $input = $text.closest('[row-id]');
                    }

                    if($input !== null && $input.length > 0){
                        $input.removeClass('hidden__row');
                    }
                }

                $('.custom-popup').remove();
            });

            $body.append($item);
        });
    }

    createSerachOutputItems(items, $body, mode, $btn){
        const oldSelected = $btn.attr('data-selected');

        items.forEach(res => {
            let nameRow;
            if(mode === StressModes.FILTERING_OUTPUT_ITEMS_NUMBER){
                nameRow = res.number;
            }else if(mode === StressModes.FILTERING_OUTPUT_ITEMS_NAME || mode === StressModes.FILTERING_OUTPUT_ITEMS_PRODUCT){
                nameRow = res.indicatorName;
            }

            const $item = $(`<div class="custom-popup__item" ${oldSelected !== undefined && oldSelected.toLowerCase() === nameRow.toString().toLowerCase() ? `style="background: #004c97; color:#fff;"`: ``}>
                <p class="custom-popup__text">${nameRow}</p>
            </div>`);

            $item.on('click', (el) => {

                const $el = $(el.currentTarget);
                const name = $el.find('.custom-popup__text').text();
                const $parent = $('#output_block_list');
                const $oldInput = $parent.find('.hidden__row');

                if($btn.length > 0){
                    let color = '#004c97'; // - default color
                    let textInfo = 'Фильтр'; // - default text info

                    if(name !== "Все"){
                        color = '#00972e'
                        textInfo = name;
                        $btn.attr('data-selected', name)
                    }else{
                        $btn.removeAttr('data-selected')
                    }

                    $btn.css('fill', color);

                    if($btn[0]._tippy !== undefined){
                        $btn[0]._tippy.setProps({
                            content: '<p class="tooltipe__text">' + textInfo + '</p>'
                        })
                    }

                }

                if($oldInput.length > 0){
                    $oldInput.removeClass('hidden__row');
                }

                let $input = null;
                if(name !== "Все"){
                    if(mode === StressModes.FILTERING_OUTPUT_ITEMS_NUMBER){
                        $parent.find('[row-id]').addClass('hidden__row');
                        $input = $parent.find('[row-id="'+ name +'"]');
                    } else if(mode === StressModes.FILTERING_OUTPUT_ITEMS_NAME){
                        $parent.find('[row-id]').addClass('hidden__row');
                        const $text = $parent.find('[field="Indicator"] [mode="view"]:contains("'+ name +'")');
                        $input = $text.closest('[row-id]');
                    }else if(mode === StressModes.FILTERING_OUTPUT_ITEMS_PRODUCT){
                        $parent.find('[row-id]').addClass('hidden__row');
                        const $text = $parent.find('[field="Product"] [mode="view"]:contains("'+ name +'")');
                        $input = $text.closest('[row-id]');
                    }

                    if($input !== null && $input.length > 0){
                        $input.removeClass('hidden__row');
                    }
                }

                $('.custom-popup').remove();
            });

            $body.append($item);
        });
    }
}
