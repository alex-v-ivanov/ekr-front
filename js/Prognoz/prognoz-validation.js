/**
 * Валидация полей и горизонтов прогноза.
 */
export class PrognozValidation {
    constructor(prognoz) {
        this.prognoz = prognoz;
    }

    checkObjects(objects, horizonFrom, horizonTo, fieldCode, isRequired, blockName) {
        const invalidObjects = [];
        const self = this.prognoz;
        if (objects.length > 1) {
            const sortedObjects = [...objects].sort((a, b) => a.horizonFrom - b.horizonFrom);

            if (blockName === "macro" || ((blockName === "custom" || blockName === "metal") && isRequired == true)) {
                const overlappingHorizons = this.findOverlappingHorizons(sortedObjects);
                if (overlappingHorizons.length > 0) {
                    return overlappingHorizons;
                }

                for (let i = 0; i < sortedObjects.length - 1; i++) {
                    const current = sortedObjects[i];
                    const next = sortedObjects[i + 1];
                    const currentMonth = current.horizonTo.getMonth() + 1;
                    const currentYear = current.horizonTo.getFullYear();
                    const nextMonth = next.horizonFrom.getMonth() + 1;
                    const nextYear = next.horizonFrom.getFullYear();
                    const expectedNextMonth = (currentMonth + 1) % 12;
                    let expectedNextYear = currentYear;
                    if (currentMonth === 12) {
                        expectedNextYear = currentYear + 1;
                    }
                    if (nextMonth !== expectedNextMonth || nextYear !== expectedNextYear) {
                        if (!invalidObjects.includes(current)) invalidObjects.push(current);
                        if (!invalidObjects.includes(next)) invalidObjects.push(next);
                    }
                }

                if (invalidObjects.length > 0) {
                    return invalidObjects;
                }

                objects.forEach(obj => {
                    const horizon1 = { start: horizonFrom, end: horizonTo };
                    const horizon2 = { start: obj.horizonFrom, end: obj.horizonTo };
                    const isCheckHorizon = this.isHorizonOverlapping(horizon1, horizon2);
                    if (!isCheckHorizon) {
                        invalidObjects.push(obj);
                    }
                });

                let overallFrom = Infinity;
                let overallTo = -Infinity;
                for (const obj of objects) {
                    if (obj.horizonFrom < overallFrom) overallFrom = obj.horizonFrom;
                    if (obj.horizonTo > overallTo) overallTo = obj.horizonTo;
                }
                if (overallFrom > horizonFrom || overallTo < horizonTo) {
                    return objects;
                }
            } else {
                const overlappingHorizons = this.findOverlappingHorizons(sortedObjects);
                if (overlappingHorizons.length > 0) {
                    return overlappingHorizons;
                }
                objects.forEach(obj => {
                    const horizon1 = { start: horizonFrom, end: horizonTo };
                    const horizon2 = { start: obj.horizonFrom, end: obj.horizonTo };
                    const isCheckHorizon = this.isHorizonOverlapping(horizon1, horizon2);
                    if (!isCheckHorizon) {
                        invalidObjects.push(obj);
                    }
                });
            }
        } else if (objects.length === 1) {
            const horizon1 = { start: horizonFrom, end: horizonTo };
            const horizon2 = { start: objects[0].horizonFrom, end: objects[0].horizonTo };

            if (blockName === "macro" || ((blockName === "custom" || blockName === "metal") && isRequired == true)) {
                const isCheckHorizon = this.isHorizonCovered(horizon2, horizon1);
                if (!isCheckHorizon) {
                    invalidObjects.push(objects[0]);
                }
            } else {
                const isCheckHorizon = this.isHorizonOverlapping(horizon1, horizon2);
                if (!isCheckHorizon) {
                    invalidObjects.push(objects[0]);
                }
            }
        }

        return invalidObjects;
    }

    isHorizonCovered(horizon1, horizon2) {
        const startsAfterOrSame = horizon2.start >= horizon1.start;
        const endsBeforeOrSame = horizon2.end <= horizon1.end;
        return startsAfterOrSame && endsBeforeOrSame;
    }

    isHorizonOverlapping(horizon1, horizon2) {
        return (horizon1.start <= horizon2.end && horizon1.end >= horizon2.start);
    }

    findOverlappingHorizons(objs) {
        const overlaps = [];
        for (let i = 0; i < objs.length; i++) {
            for (let j = i + 1; j < objs.length; j++) {
                const horizonA = objs[i];
                const horizonB = objs[j];
                if (horizonA.horizonFrom <= horizonB.horizonTo && horizonA.horizonTo >= horizonB.horizonFrom) {
                    overlaps.push(horizonA);
                    overlaps.push(horizonB);
                }
            }
        }
        return overlaps;
    }

    checkRequiredField() {
        const self = this.prognoz;
        let isCheck = true;
        const $requiredFields = $('.block-parameters__item[required], .block-parameters__item[field]');
        let info = `Поля не заполнены: \n`;
        const horizonFrom = self.HorizonFrom.selectedDates.length > 0 ? self.HorizonFrom.selectedDates[0] : null;
        const horizonTo = self.HorizonTo.selectedDates.length > 0 ? self.HorizonTo.selectedDates[0] : null;

        $requiredFields.each((idx, el) => {
            const $fieldSelect = $(el);
            let $input = $fieldSelect.find('.dropdown, .datepicker');
            const required = $fieldSelect.attr('required');
            $fieldSelect.find('.error__message').remove();

            if ($input.hasClass('dropdown')) {
                const $select = $input.find('select');
                const selectVal = $select.select2('data');
                if (required !== undefined) {
                    if (selectVal.length === 0) {
                        $input.addClass('error');
                        $fieldSelect.append('<p class="error__message">Не заполнено поле!</p>');
                        info += "-" + $fieldSelect.find('.block-parameters__text').text().replace(/\s*\*$/g, '') + "\n";
                        isCheck = false;
                    } else {
                        $input.removeClass('error');
                    }
                }
            } else if ($input.hasClass('datepicker')) {
                if (horizonFrom === null || horizonTo === null) {
                    $input.addClass('error');
                    $fieldSelect.append('<p class="error__message">Не заполнено поле!</p>');
                    info += "-" + $fieldSelect.find('.block-parameters__text').text().replace(/\s*\*$/g, '') + "\n";
                    isCheck = false;
                } else {
                    $input.removeClass('error');
                }
            }
        });

        if (!isCheck) {
            window.Reports.common.showDialog(info);
            return;
        }

        $requiredFields.each((idx, el) => {
            const $fieldSelect = $(el);
            let $input = $fieldSelect.find('.dropdown, .datepicker');
            const fieldType = $fieldSelect.attr('field');
            const nocheck = $fieldSelect.attr('nocheck');
            const code = $fieldSelect.attr('data-code');
            const required = $fieldSelect.attr('required');

            if ($input.hasClass('dropdown')) {
                const $select = $input.find('select');
                const selectVal = $select.select2('data');
                let isValueValid = false;

                if (selectVal.length > 0) {
                    if (nocheck === undefined && fieldType !== undefined && horizonFrom !== null && horizonTo !== null) {
                        if (fieldType !== "scenarioUk") {
                            const selectedItems = self.inputData.reduce((acc, inputGroup) => {
                                const matchedItems = inputGroup.items.filter(item1 =>
                                    selectVal.some(item2 => Number(item2.id) === Number(item1.id)));
                                return acc.concat(matchedItems);
                            }, []);

                            const invalidObjects = this.checkObjects(selectedItems, horizonFrom, horizonTo, code, required !== undefined, fieldType);
                            const $btnInfo = $fieldSelect.find('[btn="info"]');

                            if (invalidObjects.length > 0) {
                                if (isCheck) {
                                    isCheck = false;
                                    info = `Сохранение прервано: Выбранные формы ввода не согласованы или не охватывают горизонт RCFF. Для получения дополнительной информации нажмите кнопку «Помощь» \nПроверьте списки, выделенные красной рамкой \n`;
                                }
                                if ($btnInfo.length > 0 && $btnInfo[0]._tippy !== undefined) {
                                    const contentHtml = $btnInfo[0]._tippy.props.content;
                                    const $content = $('<div>').html(contentHtml);
                                    invalidObjects.forEach(item => {
                                        $content.find('[blockId="' + item.id + '"]').addClass('tooltipe__error');
                                    });
                                    $btnInfo[0]._tippy.setProps({ content: $content[0].innerHTML });
                                }
                                $input.addClass('error');
                            } else {
                                if ($btnInfo.length > 0 && $btnInfo[0]._tippy !== undefined) {
                                    const contentHtml = $btnInfo[0]._tippy.props.content;
                                    const $content = $('<div>').html(contentHtml);
                                    $content.find('.tooltipe__error').removeClass('tooltipe__error');
                                    $btnInfo[0]._tippy.setProps({ content: $content[0].innerHTML });
                                }
                                isValueValid = true;
                                $input.removeClass('error');
                            }
                        } else {
                            const scenarioUkSelect = self.ScenarioUKSelect.select2('data');
                            if (scenarioUkSelect.length > 0) {
                                const scenarioUKVal = scenarioUkSelect[0].text;
                                const id = scenarioUKVal.split('#;')[0];
                                const scenarioItem = self.scenarioUKData.find(item => item.id === Number(id));
                                if (scenarioItem !== undefined) {
                                    const selectedItem = self.scenarioBuilder.find(item => item.guid === scenarioItem.guid);
                                    if (selectedItem !== undefined) {
                                        let dateFrom = selectedItem.activeFrom;
                                        let dateTo = selectedItem.periodBy;
                                        if (dateFrom !== "" && dateTo !== "") {
                                            const splitDateFrom = dateFrom.split('-');
                                            const splitDateTo = dateTo.split('-');
                                            const monthTo = this.getDaysInMonth(splitDateTo[0], splitDateTo[1]);
                                            const validDateFrom = new Date(`${splitDateFrom[0]}-${splitDateFrom[1]}-01T00:00:00`);
                                            const validDateTo = new Date(`${splitDateTo[0]}-${splitDateTo[1]}-${monthTo}T00:00:00`);
                                            if (horizonFrom < validDateFrom || horizonTo > validDateTo) {
                                                isCheck = false;
                                                info = "Сценария 1С:УХ не охватывает горизонт";
                                                $input.addClass('error');
                                            } else {
                                                $input.removeClass('error');
                                            }
                                        }
                                    }
                                }
                            } else {
                                $input.removeClass('error');
                            }
                        }
                    } else {
                        isValueValid = true;
                        $input.removeClass('error');
                    }
                } else if (fieldType === "scenarioUk") {
                    $input.removeClass('error');
                }
            }
        });

        if (!isCheck) {
            window.Reports.common.showDialog(info);
        }
        return isCheck;
    }

    checkScenarioRCFF() {
        const $scenarioRCFF = $('.block-prognoz-id__input-scenarioRCFF');
        const $userId = $('#stress_test_id');
        const $version = $('#stress_test_name');
        const ID = $scenarioRCFF.text() + "_" + $userId.text() + "_" + $version.val();

        let selectedScenario = null;
        const options = this.prognoz.ScenariosPrognozComboSelected.find('option');

        options.each(function () {
            const name = $(this).text().split('#;')[1];
            if (name === ID) {
                return false;
            }
        });

        if (selectedScenario !== null) {
            return false;
        }
        return true;
    }

    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }
}
