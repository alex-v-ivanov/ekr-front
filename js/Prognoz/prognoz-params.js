/**
 * Сбор параметров, заполнение полей, фильтрация: getVersionTemplate, getCurrentUserId, getPrognozParams, fill*, clearField, loadingVersionJsonById, filterVersionList.
 */
import { PrognozType } from './constants.js';
import { ApiStatus } from '../Common/constants.js';

export class PrognozParams {
    constructor(prognoz) {
        this.prognoz = prognoz;
    }

    getPrognozParams() {
        const self = this.prognoz;
        const res = {
            scenario1C: "",
            macro: {},
            props: {},
        };

        const $scenarioUK = $('#scenarioUK');
        if (self.type === PrognozType.TYPE_0) {
            const $scenarioRCFF = $('.block-prognoz-id__input-scenarioRCFF');
            const $userId = $('#stress_test_id');
            const $version = $('#stress_test_name');
            res.ID = $scenarioRCFF.text() + "_" + $userId.text() + "_" + $version.val();
        } else if (self.type === PrognozType.TYPE_1) {
            const $user = $('.block-prognoz-id__input-user');
            const $scenarioRCFF = $('.block-prognoz-id__input-scenarioRCFF.text__blockId');
            res.ID = $scenarioRCFF.text() + "_" + $user.text();
        } else if (self.type === PrognozType.TYPE_2) {
            const $marker = $('#marker');
            const $scenarioRCFF = $('.block-prognoz-id__input-scenarioRCFF');
            const $user = $('.block-prognoz-id__text.text__blockId');
            res.ID = $marker.val() + "_" + $scenarioRCFF.text() + "_" + $user.text();
        }

        if (self.HorizonFrom.selectedDates.length !== 0 && self.HorizonTo.selectedDates.length !== 0) {
            res.HorizonFrom = '01.' + window.Reports.formatDate(self.HorizonFrom.selectedDates[0]);
            const horizonToLastDay = new Date(self.HorizonTo.selectedDates[0].getFullYear(), self.HorizonTo.selectedDates[0].getMonth() + 1, 0).getDate();
            res.HorizonTo = (horizonToLastDay <= 9 ? '0' + horizonToLastDay : horizonToLastDay) + '.' + window.Reports.formatDate(self.HorizonTo.selectedDates[0]);
        } else {
            res.HorizonFrom = '01.01.2024';
            res.HorizonTo = '31.01.2024';
        }

        const scenarioUKSelectedData = $scenarioUK.select2('data');
        if (scenarioUKSelectedData.length > 0) {
            const scenarioUKVal = scenarioUKSelectedData[0].text;
            const id = scenarioUKVal.split('#;')[0];
            const scenarioUk = self.scenarioUKData.find(item => item.id === Number(id));
            res.scenario1C = scenarioUk !== undefined ? scenarioUk.guid : '';
        }

        if (self.type === PrognozType.TYPE_1 || self.type === PrognozType.TYPE_2) {
            res.isManage = $("#isManage").is(':checked') ? 1 : 0;
        }

        const $macroFields = $('.block-parameters__item[field="macro"]');
        $macroFields.each((idx, el) => {
            const $el = $(el);
            const $fieldSelect = $el.find('select');
            if ($fieldSelect.length > 0) {
                const selectId = $fieldSelect.attr('id');
                const selected = $fieldSelect.val();
                if (selected && selected.length > 0) {
                    res.macro[selectId] = selected;
                }
            }
        });

        const $customFields = $('.block-parameters__item[field="custom"],.block-parameters__item[field="metal"]');
        $customFields.each((idx, el) => {
            const $el = $(el);
            const $fieldSelect = $el.find('select');
            const $parent = $el.closest('.tab__block');
            const blockID = $parent.attr('tabblockid');
            if ($fieldSelect.length > 0) {
                const selectId = $fieldSelect.attr('id').replace('select__', '');
                const selected = $fieldSelect.val();
                if (selected && selected.length > 0) {
                    if (!res.props[blockID]) res.props[blockID] = [];
                    res.props[blockID].push({ fieldId: selectId, value: selected });
                }
            }
        });
        return res;
    }

    fillScenarioField(id) {
        window.Reports.common.waiter.show("LoadingJSON");
        window.Reports.prognozApi.readScenarioJson(id).then(x => this.handleReadScenarioJsonResponse(x));
    }

    /** Обработчик ответа readScenarioJson: парсинг и заполнение полей. */
    handleReadScenarioJsonResponse(x) {
        if (x.status === ApiStatus.OK) {
            const json = JSON.parse(x.message);
            this.fillFieldFromJSON(json);
        } else {
            debugLog("Ошибка: " + x.message);
        }
        window.Reports.common.waiter.hide("LoadingJSON");
    }

    fillFieldFromJSON(json) {
        const self = this.prognoz;
        if (self.type === PrognozType.TYPE_0 && json.HorizonFrom !== "" && json.HorizonTo !== "") {
            const horizonFrom = self.parseDate(json.HorizonFrom);
            const horizonTo = self.parseDate(json.HorizonTo);
            self.HorizonFrom.selectDate(horizonFrom, { silent: true });
            self.HorizonTo.selectDate(horizonTo, { silent: true });
            self.HorizonTo.update({
                minDate: horizonFrom,
                maxDate: new Date(horizonFrom.getFullYear() + 10, horizonFrom.getMonth(), horizonFrom.getDate())
            });
            self.HorizonFrom.setViewDate(horizonFrom);
            self.HorizonTo.setViewDate(horizonTo);
        }

        if (json.scenario1C !== "") {
            const scenarioUk = self.scenarioUKData.find(item => item.guid === json.scenario1C);
            if (scenarioUk !== undefined) {
                self.ScenarioUKSelect.val([scenarioUk.id]).trigger('change');
                const select2Event = $.Event('select2:select');
                select2Event.params = { data: { id: scenarioUk.id, text: scenarioUk.id + "#;" + scenarioUk.name } };
                self.ScenarioUKSelect.trigger(select2Event);
            }
        } else {
            self.ScenarioUKSelect.val(null).trigger('change');
            self.ScenarioUKSelect.trigger($.Event('select2:unselect'));
        }

        if (json.macro) {
            Object.keys(json.macro).forEach(key => {
                const $el = $(`#${key}`);
                if ($el.length > 0) {
                    const $optionEl = $el.find('option');
                    const select2Ids = $optionEl.map((i, el) => $(el).val()).get();
                    const arr = json.macro[key];
                    if (Array.isArray(arr)) {
                        for (let i = arr.length - 1; i >= 0; i--) {
                            if (!select2Ids.includes(arr[i])) arr.splice(i, 1);
                        }
                        $el.val(arr).trigger('change');
                        const ev = $.Event('select2:select');
                        ev.params = { data: arr };
                        $el.trigger(ev);
                    }
                }
            });
        }

        if (json.props) {
            Object.keys(json.props).forEach(key => {
                const $block = $(`[tabblockid="${key}"]`);
                if ($block.length > 0) {
                    const fields = json.props[key];
                    fields.forEach(field => {
                        const $el = $block.find(`#select__${field.fieldId}`);
                        if ($el.length > 0) {
                            const $optionEl = $el.find('option');
                            const select2Ids = $optionEl.map((i, el) => $(el).val()).get();
                            const val = field.value;
                            if (Array.isArray(val)) {
                                for (let i = val.length - 1; i >= 0; i--) {
                                    if (!select2Ids.includes(val[i])) val.splice(i, 1);
                                }
                                $el.val(val).trigger('change');
                                const ev = $.Event('select2:select');
                                ev.params = { data: val };
                                $el.trigger(ev);
                            }
                        }
                    });
                }
            });
        }
    }

    fillVersionField(id) {
        window.Reports.common.waiter.show("LoadingJSON");
        this.loadingVersionJsonById(id).then(res => {
            if (res !== null) {
                this.fillFieldFromJSON(res);
            }
            window.Reports.common.waiter.hide("LoadingJSON");
        }).catch(message => {
            debugLog('Ошибка: ' + message);
            window.Reports.common.waiter.hide("LoadingJSON");
        });
    }

    loadingVersionJsonById(id) {
        return window.Reports.prognozApi.readVersionJson(id).then(x => {
            if (x.status !== ApiStatus.ERROR) {
                const json = JSON.parse(x.message);
                return json !== undefined ? json : null;
            }
            return Promise.reject(x.message);
        });
    }

    filterVersionList(from, to, type) {
        const $versions = $('.ListRow');
        const typeName = type.text.split('#;')[1];
        $versions.each((i, el) => {
            const $item = $(el);
            const created = $item.attr('data-created');
            const version = $item.attr('data-version');
            if (created !== "") {
                let createdDate = new Date(created);
                if (createdDate >= from && createdDate <= to) {
                    if (typeName !== "Все") {
                        if (typeName.toLowerCase() !== version) {
                            $item.addClass('Hidden');
                        } else {
                            $item.removeClass('Hidden');
                        }
                    } else {
                        $item.removeClass('Hidden');
                    }
                } else {
                    $item.addClass('Hidden');
                }
            }
        });
        this.prognoz.loadingSearchData();
    }

    clearField() {
        const $fields = $('[block="macroparameters"] [field], [block="scenarioIndicatorsRCFF"] [field], [block="parameters"] [field]');
        $fields.each((i, field) => {
            const $field = $(field);
            const $select = $field.find('select');
            const $btnInfo = $field.find('[btn="info"]');
            if ($btnInfo.length > 0) {
                const html = '<p class="tooltipe__text">Нет данных</p>';
                if ($btnInfo[0]._tippy !== undefined) {
                    $btnInfo[0]._tippy.setProps({ content: html });
                } else {
                    if (typeof tippy !== 'undefined') {
                        tippy($btnInfo[0], {
                            content: html,
                            animation: 'fade',
                            followCursor: true,
                            arrow: false,
                            allowHTML: true,
                        });
                    }
                }
            }
            $field.find('.dropdown').removeClass('error');
            $select.val(null).trigger('change');
        });
    }

    getVersionTemplate() {
        return $(`
                <div class="ListRow" isActive="false">
                    <div class="RowItem RowInlineContent LongItem" field="Name" style="border:unset;overflow: hidden;overflow-wrap: anywhere;">
                        <div mode="view">
                            <span class="RowItemName"></span> 
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <div class="RowItem RowInlineContent LongItem" field="DateCreation" style="border:unset; width: auto;">
                            <div mode="view">
                                <p style="margin: 0; display: flex; gap: 0.5rem; flex-direction: column;">Дата создания: <span class="RowItemName"></span></p>
                            </div>
                        </div>
                        <div class="RowItem RowInlineContent LongItem" field="Version" style="border:unset; width: auto;">
                            <div mode="view">
                                <p style="margin: 0; display: flex; gap: 0.5rem; flex-direction: column;">Тип версии <span class="RowItemName"></span></p>
                            </div>
                        </div>
                    </div>
                    <div class="RowItem RowInlineContent" style="border:unset; height: 100%;">
                        <div style="margin-left: auto;gap: 0.5rem;align-items: center;display: flex;height: 100%;">
                            <svg rowBtn="details" class="hidden" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Подробнее" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M21 19C21 19.2652 20.8946 19.5196 20.7071 19.7071C20.5196 19.8946 20.2652 20 20 20H12C11.7348 20 11.4804 19.8946 11.2929 19.7071C11.1054 19.5196 11 19.2652 11 19C11 18.7348 11.1054 18.4804 11.2929 18.2929C11.4804 18.1054 11.7348 18 12 18H20C20.2652 18 20.5196 18.1054 20.7071 18.2929C20.8946 18.4804 21 18.7348 21 19ZM20 14H12C11.7348 14 11.4804 14.1054 11.2929 14.2929C11.1054 14.4804 11 14.7348 11 15C11 15.2652 11.1054 15.5196 11.2929 15.7071C11.4804 15.8946 11.7348 16 12 16H20C20.2652 16 20.5196 15.8946 20.7071 15.7071C20.8946 15.5196 21 15.2652 21 15C21 14.7348 20.8946 14.4804 20.7071 14.2929C20.5196 14.1054 20.2652 14 20 14ZM27 6V27C27 27.5304 26.7893 28.0391 26.4142 28.4142C26.0391 28.7893 25.5304 29 25 29H7C6.46957 29 5.96086 28.7893 5.58579 28.4142C5.21071 28.0391 5 27.5304 5 27V6C5 5.46957 5.21071 4.96086 5.58579 4.58579C5.96086 4.21072 6.46957 4 7 4H11.5325C12.0944 3.37091 12.7828 2.86757 13.5527 2.52295C14.3225 2.17833 15.1565 2.00018 16 2.00018C16.8435 2.00018 17.6775 2.17833 18.4473 2.52295C19.2172 2.86757 19.9056 3.37091 20.4675 4H25C25.5304 4 26.0391 4.21072 26.4142 4.58579C26.7893 4.96086 27 5.46957 27 6ZM12 8H20C20 6.93914 19.5786 5.92172 18.8284 5.17157C18.0783 4.42143 17.0609 4 16 4C14.9391 4 13.9217 4.42143 13.1716 5.17157C12.4214 5.92172 12 6.93914 12 8ZM25 6H21.6562C21.8837 6.64227 22 7.31864 22 8V9C22 9.26522 21.8946 9.51957 21.7071 9.70711C21.5196 9.89464 21.2652 10 21 10H11C10.7348 10 10.4804 9.89464 10.2929 9.70711C10.1054 9.51957 10 9.26522 10 9V8C10 7.31864 10.1163 6.64227 10.3438 6H7V27H25V6Z" />
                            </svg>
                            <svg rowBtn="removeRow" class="Hidden" fill="#aa1212" style="cursor: pointer;" tooltipe="Удалить" width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M27 6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM24 26H8V8H24V26ZM10 3C10 2.73478 10.1054 2.48043 10.2929 2.29289C10.4804 2.10536 10.7348 2 11 2H21C21.2652 2 21.5196 2.10536 21.7071 2.29289C21.8946 2.48043 22 2.73478 22 3C22 3.26522 21.8946 3.51957 21.7071 3.70711C21.5196 3.89464 21.2652 4 21 4H11C10.7348 4 10.4804 3.89464 10.2929 3.70711C10.1054 3.51957 10 3.26522 10 3Z" />
                            </svg>
                        </div>
                    </div>
                </div>`);
    }

    getCurrentUserId() {
        const currentDate = new Date();
        const dd = currentDate.getDate() > 9 ? currentDate.getDate() : "0" + currentDate.getDate();
        const mm = currentDate.getMonth() + 1 > 9 ? currentDate.getMonth() + 1 : "0" + (currentDate.getMonth() + 1);
        const yy = currentDate.getFullYear().toString().slice(-2);
        const userName = typeof window.Reports !== 'undefined' ? window.Reports.UserName : '';
        return `${dd}${mm}${yy}_${userName}`;
    }
}
