/**
 * Действия прогноза: сохранение сценариев, расчёт, удаление.
 * Использует prognoz (фасад), window.Reports.common, window.Reports.prognozApi.
 */
import { PrognozType } from './constants.js';
import { PrognozMessages } from './constants.js';
import { ApiStatus } from '../Common/constants.js';

export class PrognozActions {
    constructor(prognoz) {
        this.prognoz = prognoz;
    }

    ScenSaveAs() {
        const self = this.prognoz;
        const $marker = $('#stress_test_name');
        const $scenarioRCFF = $('#scenarioRCFF');
        const scenarioRCFFData = $scenarioRCFF.select2('data');
        if (scenarioRCFFData.length === 0) {
            window.Reports.common.showDialog(PrognozMessages.FILL_SCENARIO_RCFF);
            return;
        }

        if ($marker.val() !== "") {
            if (self.checkScenarioRCFF()) {
                if (self.checkRequiredField()) {
                    let json = self.getPrognozParams();
                    let newJson = {
                        HorizontDateFrom: json.HorizonFrom,
                        HorizontDateTo: json.HorizonTo,
                        Scenario1C: json.scenario1C,
                    };
                    window.Reports.prognozApi.scenSaveAs(newJson, json.ID, window.Reports.UserName)
                        .then(x => this.handleScenSaveAsResponse(x, json, self));
                }
            } else {
                window.Reports.common.showDialog(PrognozMessages.SCENARIO_SAVE_FAILED, "Error");
            }
        } else {
            window.Reports.common.showDialog(PrognozMessages.MARKER_NOT_FILLED);
        }
    }

    ScenSave() {
        const self = this.prognoz;
        const SaveBtnEl = $('#SaveBtn');
        if (!SaveBtnEl.hasClass('Disabled')) {
            if (self.checkRequiredField()) {
                let json = self.getPrognozParams();
                const $scenarioRCFF = $('#scenarioRCFF');
                const scenarioRCFFData = $scenarioRCFF.select2('data');

                if (scenarioRCFFData.length > 0) {
                    const scenarioRCFF = scenarioRCFFData[0];
                    const scenarioRCFFID = scenarioRCFF.text.split('#;')[0];
                    const scenarioName = scenarioRCFF.text.split('#;')[1];

                    let newJson = {
                        HorizontDateFrom: json.HorizonFrom,
                        HorizontDateTo: json.HorizonTo,
                        Scenario1C: json.scenario1C,
                    };

                    window.Reports.prognozApi.scenSave(newJson, scenarioRCFF.text.split('#;')[1], scenarioRCFF.text.split('#;')[0], window.Reports.UserName)
                        .then(x => this.handleScenSaveResponse(x, json, scenarioRCFFID, self));
                }
            }
        } else {
            window.Reports.common.showDialog(PrognozMessages.CAN_EDIT_OWN_ONLY);
        }
    }

    Applay() {
        const Reports = window.Reports;
        const $select = this.prognoz.ForecastDefaultComboSelected;
        const selected = $select.select2('data');
        const selectedId = $select.val();
        const $parent = $select.closest('[input]');

        const $custSelected = $('.block-parameters__item[field="custom"] select');

        $custSelected.each((idx, el) => {
            const $fieldSelect = $(el);
            $fieldSelect.val(selectedId).trigger('change');
            var select2Event = $.Event('select2:select');
            select2Event.params = { data: selectedId };
            $fieldSelect.trigger(select2Event);
        });
    }

    Calculate() {
        const self = this.prognoz;
        if (self.DepthFrom.selectedDates.length === 0 || self.DepthTo.selectedDates.length === 0) {
            window.Reports.common.showDialog(PrognozMessages.FILL_DEPTH);
            return;
        }

        if (self.HorizonFrom.selectedDates.length === 0 || self.HorizonTo.selectedDates.length === 0) {
            window.Reports.common.showDialog(PrognozMessages.FILL_HORIZON);
            return;
        }

        if (self.type === PrognozType.TYPE_1) {
            const $versionRCFF = $('#versionRCFF');
            const versionRCFFData = $versionRCFF.select2('data');
            if (versionRCFFData.length === 0) {
                window.Reports.common.showDialog(PrognozMessages.FILL_VERSION_RCFF);
                return;
            }
        } else {
            const $scenarioRCFF = $('#scenarioRCFF');
            const scenarioRCFFData = $scenarioRCFF.select2('data');
            if (scenarioRCFFData.length === 0) {
                window.Reports.common.showDialog(PrognozMessages.FILL_SCENARIO_RCFF);
                return;
            }
        }

        let elemName = "";
        let checkElemName = "";
        const $scenarioRCFFText = $('.block-prognoz-id__input-scenarioRCFF');
        let marker = $('#marker');

        if (self.type === PrognozType.TYPE_1) {
            const $userId = $('.block-prognoz-id__input-user');
            elemName = $scenarioRCFFText.text() + "_" + $userId.text();
            checkElemName = $scenarioRCFFText.text();
        } else if (self.type === PrognozType.TYPE_2) {
            if (marker.val() !== "") {
                const $userId = $('.block-prognoz-id__text');
                elemName = marker.val() + "_" + $scenarioRCFFText.text() + "_" + $userId.text();
                checkElemName = elemName;
            } else {
                window.Reports.common.showDialog(PrognozMessages.MARKER_NOT_FILLED);
                return;
            }
        }

        window.Reports.prognozApi.getCountAPI("DK_VERSION_NSISPRAV_1995", checkElemName)
            .then(res => this.handleGetCountAPIResponse(res, self, elemName));
    }

    sendRequest(json, elemName) {
        const self = this.prognoz;
        let marker = $('#marker');
        let versName = "";
        window.Reports.common.waiter.show("sendRequest");
        let newJson = {
            HorizontDateFrom: json.HorizonFrom,
            HorizontDateTo: json.HorizonTo,
            Scenario1C: json.scenario1C,
            DateCloseKFO: '01.' + window.Reports.formatDate(self.dtCloseKFO),
            ScenariosPrognoz: "",
            DepthDateFrom: "",
            DepthDateTo: "",
            IsManage: json.isManage,
        };

        if (self.DepthFrom.selectedDates.length !== 0 && self.DepthTo.selectedDates.length !== 0) {
            newJson.DepthDateFrom = '01.' + window.Reports.formatDate(self.DepthFrom.selectedDates[0]);
            const depthToLastDay = new Date(self.DepthTo.selectedDates[0].getFullYear(), self.DepthTo.selectedDates[0].getMonth() + 1, 0).getDate();
            newJson.DepthDateTo = (depthToLastDay <= 9 ? '0' + depthToLastDay : depthToLastDay) + '.' + window.Reports.formatDate(self.DepthTo.selectedDates[0]);
        }

        let _params = [
            window.Reports.bi.OpenArgs("json", JSON.stringify(newJson), window.Reports.bi.ItDataType.String),
            window.Reports.bi.OpenArgs("userName", window.Reports.UserName, window.Reports.bi.ItDataType.String),
            window.Reports.bi.OpenArgs("elemName", elemName, window.Reports.bi.ItDataType.String)
        ];

        if (self.type === PrognozType.TYPE_1) {
            const $versionRCFF = $('#versionRCFF');
            const versionRCFFData = $versionRCFF.select2('data');
            if (versionRCFFData.length > 0) {
                const versionVal = versionRCFFData[0].text;
                _params.push(window.Reports.bi.OpenArgs("iVersion", Number(versionVal.split('#;')[0]), window.Reports.bi.ItDataType.Integer));
            }
        } else if (self.type === PrognozType.TYPE_2) {
            newJson.PrognozMarker = marker.val();
            const $scenarioRCFF = $('#scenarioRCFF');
            const scenarioRCFFData = $scenarioRCFF.select2('data');
            if (scenarioRCFFData.length > 0) {
                const scenarioVal = scenarioRCFFData[0].text;
                _params.push(window.Reports.bi.OpenArgs("scenarioId", Number(scenarioVal.split('#;')[0]), window.Reports.bi.ItDataType.Integer));
            }
        }

        const apiCall = self.type !== 1
            ? window.Reports.prognozApi.startPrognoz(_params)
            : window.Reports.prognozApi.recalcPrognoz(_params);
        apiCall.then(x => this.handleSendRequestResponse(x, json, versName, self));
    }

    DeleteScenarioRCFF() {
        const self = this.prognoz;
        const scenarios = self.ScenariosPrognozComboSelected.select2('data');
        const removeBtnEl = $('#DeleteBtn');
        if (scenarios.length > 0) {
            const scenarioSplite = scenarios[0].text.split('#;');
            const scenarioId = Number(scenarioSplite[0]);
            const scenarioName = scenarioSplite[1];

            if (!removeBtnEl.hasClass('Disabled')) {
                window.Reports.common.showDialog(`Вы действительно хотите удалить "${scenarioName}"?`, "Exclamation", () => {
                    window.Reports.prognozApi.scenDelete(scenarioId).then(x => this.handleScenDeleteResponse(x, scenarioName, self));
                });
            } else {
                if (!self.ScenariosDefault.includes(scenarioName)) {
                    window.Reports.common.showDialog(PrognozMessages.CAN_DELETE_OWN_ONLY);
                }
            }
        }
    }

    /** Обработчик ответа scenSaveAs: при успехе вызывает saveJsonToVersion и обновляет комбо. */
    handleScenSaveAsResponse(x, json, self) {
        if (x.status !== ApiStatus.OK) {
            window.Reports.common.showDialog(x.message, "Error");
            return;
        }
        window.Reports.prognozApi.saveJsonToVersion(JSON.stringify(json), x.message)
            .then(data => this.handleSaveJsonToVersionAfterScenSaveAs(data, x, json, self));
    }

    /** Обработчик ответа saveJsonToVersion после ScenSaveAs: обновление комбо сценариев. */
    handleSaveJsonToVersionAfterScenSaveAs(data, x, json, self) {
        if (data.status === ApiStatus.OK) {
            window.Reports.common.showDialog(PrognozMessages.SCENARIO_SAVED);
            const newScen = { id: Number(x.message), text: x.message + "#;" + json.ID };
            const newOption = new Option(newScen.text, newScen.id, false, false);
            self.ScenariosPrognozComboSelected.find('option').eq(3).before(newOption);
            self.ScenariosPrognozComboSelected.val([newScen.id]).trigger('change');
            const select2Event = $.Event('select2:select');
            select2Event.params = { data: newScen };
            self.ScenariosPrognozComboSelected.trigger(select2Event);
        } else {
            window.Reports.common.showDialog(x.message, "Error");
        }
    }

    /** Обработчик ответа scenSave: при успехе вызывает saveJsonToVersion. */
    handleScenSaveResponse(x, json, scenarioRCFFID, self) {
        if (x.status !== ApiStatus.OK) {
            window.Reports.common.showDialog(x.message, "Error");
            return;
        }
        window.Reports.prognozApi.saveJsonToVersion(JSON.stringify(json), scenarioRCFFID).then(innerX => {
            if (innerX.status === ApiStatus.OK) {
                window.Reports.common.showDialog(PrognozMessages.SCENARIO_UPDATED);
            } else {
                window.Reports.common.showDialog(innerX.message, "Error");
            }
        });
    }

    /** Обработчик ответа getCountAPI: проверка версии и вызов sendRequest. */
    handleGetCountAPIResponse(res, self, elemName) {
        if (res.status !== ApiStatus.OK) {
            window.Reports.common.showDialog(res.message, "Error");
            return;
        }
        if (res.message !== "0") {
            if (self.type === PrognozType.TYPE_1) {
                elemName = elemName.slice(0, -1) + (Number(res.message) + 1);
            } else {
                window.Reports.common.showDialog(PrognozMessages.VERSION_MARKER_EXISTS, "Error");
                return;
            }
        }
        if (self.checkRequiredField()) {
            const json = self.getPrognozParams();
            window.Reports.common.waiter.show("Calculate");
            self.sendRequest(json, elemName);
            window.Reports.common.waiter.hide("Calculate");
        }
    }

    /** Обработчик ответа startPrognoz/recalcPrognoz: сообщение и обновление inputData. */
    handleSendRequestResponse(x, json, versName, self) {
        if (x.status === ApiStatus.OK) {
            window.Reports.common.showDialog(PrognozMessages.CALC_STARTED);
            if (self.type === PrognozType.TYPE_2) {
                const data = self.inputData.find(item => Number(item.group) === 30);
                if (data !== undefined) {
                    const from = new Date(json.HorizonFrom.split('.').reverse().join('-') + "T00:00:00");
                    const to = new Date(json.HorizonTo.split('.').reverse().join('-') + "T00:00:00");
                    data.items.push({
                        id: x.message,
                        name: versName,
                        horizonFrom: from,
                        horizonTo: to,
                        horizonVal: 0,
                        versionType: "2",
                        created: new Date(),
                        author: window.Reports.UserName,
                    });
                }
            }
        } else {
            window.Reports.common.showDialog(x.message, "Error");
        }
        window.Reports.common.waiter.hide("sendRequest");
    }

    /** Обработчик ответа scenDelete: обновление UI после удаления сценария. */
    handleScenDeleteResponse(x, scenarioName, self) {
        if (x.status === ApiStatus.OK) {
            window.Reports.common.showDialog(PrognozMessages.SCENARIO_DELETED + scenarioName + PrognozMessages.SCENARIO_DELETED_SUFFIX);
            const $fields = $('.block-parameters__item select');
            $('#scenarioRCFFID').val([0]).trigger('change');
            $fields.each((idx, el) => {
                const $fieldSelect = $(el);
                $fieldSelect.val(null).trigger('change');
            });
            self.HorizonFrom.clear();
            self.HorizonTo.clear();
            self.loadingScenariosPrognozData();
            $('#stress_test_name').val('');
            $('.block-prognoz-id__input-scenarioRCFF').text('');
            $("#SaveBtn").addClass("Disabled");
            $("#DeleteBtn").addClass("Disabled");
        } else {
            window.Reports.common.showDialog(x.message, "Error");
        }
    }
}
