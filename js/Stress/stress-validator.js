/**
 * Валидация параметров стресс-теста: дубликаты, исторические диапазоны.
 */
export class Validator {
    checkForDuplicates(data) {
        const results = {
            duplicateInputsWithSameAnalytics: false,
            duplicateInputsWithoutAnalytics: false,
            duplicateOutputsWithSameAnalytics: false,
            duplicateOutputsWithoutAnalytics: false,
            details: []
        };

        if (data.Input && data.Input.length > 0) {
            const inputKeys = new Map();
            const inputKeysWithoutAnalytics = new Map();

            for (const input of data.Input) {
                const key = input.key;
                const hasAnalytics = input.analytics && Object.values(input.analytics).some(val => val !== "-1");

                if (hasAnalytics) {
                    const compositeKey = `${key}_${JSON.stringify(input.analytics)}`;
                    if (inputKeys.has(compositeKey)) {
                        results.duplicateInputsWithSameAnalytics = true;
                        const originalInput = inputKeys.get(compositeKey);
                        results.details.push(
                            `Дубль INPUT найден: ${originalInput.name} (№ ${originalInput.number}) с той же аналитикой. ` +
                            `Дубль INPUT найден: ${input.name} (№ ${input.number}) с той же аналитикой. `
                        );
                    } else {
                        inputKeys.set(compositeKey, input);
                    }
                } else {
                    if (inputKeysWithoutAnalytics.has(key)) {
                        results.duplicateInputsWithoutAnalytics = true;
                        const originalInput = inputKeysWithoutAnalytics.get(key);
                        results.details.push(
                            `Дубль INPUT найден: ${originalInput.name} (№ ${originalInput.number}) без аналитики.` +
                            `Дубль INPUT найден: ${input.name} (№ ${input.number}) без аналитики. `
                        );
                    } else {
                        inputKeysWithoutAnalytics.set(key, input);
                    }
                }
            }
        }

        if (data.Output && data.Output.length > 0) {
            const outputKeys = new Map();
            const outputKeysWithoutAnalytics = new Map();

            for (const output of data.Output) {
                const key = output.key;
                const hasAnalytics = output.analytics && Object.values(output.analytics).some(val => val !== "-1");

                if (hasAnalytics) {
                    const compositeKey = `${key}_${JSON.stringify(output.analytics)}`;
                    if (outputKeys.has(compositeKey)) {
                        results.duplicateOutputsWithSameAnalytics = true;
                        const originalOutput = outputKeys.get(compositeKey);
                        results.details.push(
                            `Дубль OUTPUT найден: ${output.name} (№ ${output.number}) с той же аналитикой. ` +
                            `Оригинал: ${originalOutput.name} (№ ${originalOutput.number})`
                        );
                    } else {
                        outputKeys.set(compositeKey, output);
                    }
                } else {
                    if (outputKeysWithoutAnalytics.has(key)) {
                        results.duplicateOutputsWithoutAnalytics = true;
                        const originalOutput = outputKeysWithoutAnalytics.get(key);
                        results.details.push(
                            `Дубль OUTPUT найден: ${output.name} (№ ${output.number}) без аналитики. ` +
                            `Оригинал: ${originalOutput.name} (№ ${originalOutput.number})`
                        );
                    } else {
                        outputKeysWithoutAnalytics.set(key, output);
                    }
                }
            }
        }

        return results;
    }

    validateInputParameters(config) {
        const errors = [];

        if (!config || !config.Input || !Array.isArray(config.Input)) {
            return {
                isValid: false,
                errors: ['Неверная структура конфигурации: отсутствуют INPUT-параметры']
            };
        }

        config.Input.forEach(input => {
            const hasDateRange = input.dateFrom && input.dateTo;
            const hasExcelMatrix = input.ExcelGUID && input.ExcelType;

            if (!hasDateRange && !hasExcelMatrix) {
                errors.push(`Не задан исторический диапазон для INPUT-показателя #${input.number} (${input.name})`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}
