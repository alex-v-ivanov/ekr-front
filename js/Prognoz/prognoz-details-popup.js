/**
 * Попап «Подробнее» для просмотра деталей версии прогноза.
 * Получает ссылку на фасад prognoz для доступа к данным и методам.
 */
import { PrognozMessages } from './constants.js';

export class DetailsPopUp {
    constructor(prognoz) {
        this.prognoz = prognoz;
    }

    init() {
        this.renderField();
    }

    openModal(id) {
        const prognoz = this.prognoz;
        window.Reports.common.waiter.show('loadingDetails');
        if (id !== "") {
            this.loadingDataByVersionId(id);
        }
    }

    closeModal() {
        const $modal = $(".SelectDetails");
        $modal.toggleClass("Hidden");
        this.clearModal();
    }

    clearModal() {
        const $modal = $(".SelectDetails");
        const $body = $modal.find('.SelectDetailsContent');
        const $btnDisable = $('[rowbtn="details"]');
        $btnDisable.removeClass('disable');
        $body.find('.details__box').empty();
    }

    loadingDataByVersionId(id) {
        this.prognoz.loadingVersionJsonById(id)
            .then(res => this.handleLoadingDetailsResponse(res))
            .catch(message => {
                window.Reports.common.showDialog(PrognozMessages.ERROR_PREFIX + message);
            });
    }

    /** Обработчик ответа loadingVersionJsonById: открытие модалки и заполнение полей. */
    handleLoadingDetailsResponse(res) {
        if (res !== null) {
            $('html').animate({ scrollTop: 0 }, 500);
            const $modal = $(".SelectDetails");
            this.fillField(res);
            $modal.toggleClass("Hidden");
        }
        window.Reports.common.waiter.hide('loadingDetails');
    }

    fillField(json) {
        const $body = $('.SelectDetailsContent');
        const htmlField = `
                        <div style="display: grid; grid-template-columns: 1fr auto;">
                            <p class="details__text"></p>
                            <svg data-btn="info" width="24" height="24" viewBox="0 0 32 32" fill="#004C97" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 3C13.4288 3 10.9154 3.76244 8.77759 5.1909C6.63975 6.61935 4.97351 8.64968 3.98957 11.0251C3.00563 13.4006 2.74819 16.0144 3.2498 18.5362C3.75141 21.0579 4.98953 23.3743 6.80762 25.1924C8.6257 27.0105 10.9421 28.2486 13.4638 28.7502C15.9856 29.2518 18.5995 28.9944 20.9749 28.0104C23.3503 27.0265 25.3807 25.3603 26.8091 23.2224C28.2376 21.0846 29 18.5712 29 16C28.9964 12.5533 27.6256 9.24882 25.1884 6.81163C22.7512 4.37445 19.4467 3.00364 16 3ZM16 27C13.8244 27 11.6977 26.3549 9.88873 25.1462C8.07979 23.9375 6.66989 22.2195 5.83733 20.2095C5.00477 18.1995 4.78693 15.9878 5.21137 13.854C5.63581 11.7202 6.68345 9.7602 8.22183 8.22183C9.76021 6.68345 11.7202 5.6358 13.854 5.21136C15.9878 4.78692 18.1995 5.00476 20.2095 5.83733C22.2195 6.66989 23.9375 8.07979 25.1462 9.88873C26.3549 11.6977 27 13.8244 27 16C26.9967 18.9164 25.8367 21.7123 23.7745 23.7745C21.7123 25.8367 18.9164 26.9967 16 27ZM18 22C18 22.2652 17.8946 22.5196 17.7071 22.7071C17.5196 22.8946 17.2652 23 17 23C16.4696 23 15.9609 22.7893 15.5858 22.4142C15.2107 22.0391 15 21.5304 15 21V16C14.7348 16 14.4804 15.8946 14.2929 15.7071C14.1054 15.5196 14 15.2652 14 15C14 14.7348 14.1054 14.4804 14.2929 14.2929C14.4804 14.1054 14.7348 14 15 14C15.5304 14 16.0391 14.2107 16.4142 14.5858C16.7893 14.9609 17 15.4696 17 16V21C17.2652 21 17.5196 21.1054 17.7071 21.2929C17.8946 21.4804 18 21.7348 18 22ZM14 10.5C14 10.2033 14.088 9.91332 14.2528 9.66665C14.4176 9.41997 14.6519 9.22771 14.926 9.11418C15.2001 9.00065 15.5017 8.97094 15.7926 9.02882C16.0836 9.0867 16.3509 9.22956 16.5607 9.43934C16.7704 9.64912 16.9133 9.91639 16.9712 10.2074C17.0291 10.4983 16.9994 10.7999 16.8858 11.074C16.7723 11.3481 16.58 11.5824 16.3334 11.7472C16.0867 11.912 15.7967 12 15.5 12C15.1022 12 14.7206 11.842 14.4393 11.5607C14.158 11.2794 14 10.8978 14 10.5Z"></path>
                            </svg>
                        </div>`;

        if (json.HorizonFrom !== "" && json.HorizonTo !== "") {
            const $horizonField = $(htmlField);
            $horizonField.find('.details__text').text(json.HorizonFrom + " - " + json.HorizonTo);
            $horizonField.find('[data-btn="info"]').remove();
            $body.find('[data-details-field="horizon"] .details__box').append($horizonField);
        }

        if (json.scenario1C !== "") {
            let html = '<p class="tooltipe__text">Нет данных</p>';
            const $scenario1CField = $(htmlField);
            const scenarioBuilder = this.prognoz.scenarioBuilder.find(item => item.guid === json.scenario1C);

            if (scenarioBuilder !== undefined) {
                $scenario1CField.find('.details__text').text(scenarioBuilder.name);
                const activeParans = scenarioBuilder.params.filter(item => item.status === true);
                html = '';
                if (scenarioBuilder.activeFrom !== "") {
                    html += `<p class="tooltipe__text">Действует с ${scenarioBuilder.activeFrom?.split('-').reverse().join('.')} по ${scenarioBuilder.periodBy?.split('-').reverse().join('.')}</p>`;
                }
                activeParans.forEach(item => {
                    html += `<p class="tooltipe__text">- ${item.name}</p>`;
                });
                if (html === "") {
                    html = '<p class="tooltipe__text">Нет данных</p>';
                }
            }
            this.initBtnInfo($scenario1CField.find('[data-btn="info"]'), html);
            $body.find('[data-details-field="scenarioUK"] .details__box').append($scenario1CField);
        }

        Object.keys(json.macro).forEach(key => {
            let html = '<p class="tooltipe__text">Нет данных</p>';
            const $el = $body.find(`[data-details-field="${key}"]`);
            if ($el.length > 0) {
                json.macro[key].forEach(item => {
                    let $elField = $(htmlField);
                    const fieldData = this.getFieldData(item, key);
                    if (fieldData !== null) {
                        $elField.find('.details__text').text(fieldData.text);
                        html = fieldData.html;
                    }
                    if (html !== null) {
                        this.initBtnInfo($elField.find('[data-btn="info"]'), html);
                    } else {
                        $elField.find('[data-btn="info"]').addClass('Hidden');
                    }
                    $el.find('.details__box').append($elField);
                });
            }
        });

        Object.keys(json.props).forEach(key => {
            const $block = $(`.details__block [tabblockid="${key}"]`);
            if ($block.length > 0) {
                const fields = json.props[key];
                fields.forEach(field => {
                    const $el = $block.find(`[data-details-field="field__${field.fieldId}"]`);
                    if ($el.length > 0) {
                        field.value.forEach(item => {
                            let $elField = $(htmlField);
                            const fieldData = this.getFieldData(item, key);
                            if (fieldData !== null) {
                                $elField.find('.details__text').text(fieldData.text);
                                html = fieldData.html;
                            }
                            if (html !== null) {
                                this.initBtnInfo($elField.find('[data-btn="info"]'), html);
                            } else {
                                $elField.find('[data-btn="info"]').addClass('Hidden');
                            }
                            $el.find('.details__box').append($elField);
                        });
                    }
                });
            }
        });
    }

    renderField() {
        const prognoz = this.prognoz;
        const $nav = $('.details__nav');
        const $content = $('.details__body');
        let custIndex = 0;
        prognoz.ModelBlockData.forEach((block) => {
            const fields = prognoz.ScenarioIndicatorsData.filter(item => item.blockId === block.id);
            if (fields.length > 0) {
                const $tab = $(`<div class="tab__item" tabId="${block.id}">
                            <p class="tab__name">${block.name}</p>
                            </div>`);
                const $tabBlock = $(`<div class="tab__block" tabBlockId="${block.id}">
                            </div`);
                fields.forEach(field => {
                    const $selectField = this.getField(field);
                    $tabBlock.append($selectField);
                });
                $tab.on('click', (e) => {
                    const $tab = $(e.currentTarget);
                    const $parent = $tab.closest('.details__item');
                    const blockId = $tab.attr('tabid');
                    $parent.find('.tab__item.tab__active').removeClass('tab__active');
                    $parent.find('.tab__block.tab__block-active').removeClass('tab__block-active');
                    $tab.addClass('tab__active');
                    $parent.find('.tab__block[tabblockid="' + blockId + '"]').addClass('tab__block-active');
                });
                if (custIndex === 0) {
                    $tab.addClass('tab__active');
                    $tabBlock.addClass('tab__block-active');
                }
                $nav.append($tab);
                $content.append($tabBlock);
                custIndex++;
            }
        });
    }

    getField(field) {
        return $(`
                    <div class="details__field" data-details-field="field__${field.id}">
                        <p class="details__title" title="${field.name}">${field.name} :</p>
                        <div class="details__box"></div>
                    </div>`);
    }

    initBtnInfo($el, html) {
        if ($el[0]._tippy !== undefined) {
            $el[0]._tippy.setProps({ content: html });
        } else {
            tippy($el[0], {
                content: html,
                animation: 'fade',
                followCursor: true,
                arrow: false,
                allowHTML: true,
            });
        }
    }

    getFieldData(id, fieldName) {
        const prognoz = this.prognoz;
        let selectedItem = null;

        if (fieldName !== "TypeinterestRate" && fieldName !== "inflationProp") {
            selectedItem = prognoz.inputData.reduce((foundItem, inputGroup) => {
                if (foundItem) return foundItem;
                const item = inputGroup.items.find(input => Number(input.id) === Number(id));
                return item || null;
            }, null);
        } else if (fieldName === "inflationProp") {
            const item = prognoz.inflationPropData.find(item => Number(item.k) === Number(id));
            if (item !== undefined) {
                return { text: item.n, html: null };
            }
        }

        if (selectedItem !== null) {
            return {
                text: selectedItem.name,
                html: `<div class="tooltipe__block" blockId="${selectedItem.id}">
                            <p class="tooltipe__text">Параметр: ${selectedItem.name}</p>
                            ${selectedItem.horizonVal > 0 ? `<p class="tooltipe__text">Горизонт: ${selectedItem.horizonVal} ${prognoz.getYearWord(selectedItem.horizonVal)}</p>` : ''}
                            <p class="tooltipe__text">Периодичность: ${selectedItem.periodicity}</p>
                            <p class="tooltipe__text">Действует с ${selectedItem.horizonFrom.toLocaleDateString('ru-RU').replace(/\//g, '.')} по ${selectedItem.horizonTo.toLocaleDateString('ru-RU').replace(/\//g, '.')}</p>
                        </div>`
            };
        }
        return null;
    }
}

/**
 * Попап «Помощь». Не зависит от фасада — только переключение видимости модалки.
 */
export class HelpPopUp {
    openModal() {
        const $modal = $(".SelectHelp");
        $modal.toggleClass("Hidden");
    }

    closeModal() {
        const $modal = $(".SelectHelp");
        $modal.toggleClass("Hidden");
    }
}
