/**
 * Guard выбора набора данных (п.19 §5).
 */
export class ArrayDataPopUpValidator {

  /** Легасi `StressValidationMessages.COULD_NOT_GET_EXCEL_DATA` (`constants.js`). */
  static COULD_NOT_GET_EXCEL_DATA = 'Не удалось получить данные с метода GetExcelDataSets'

  /** Легасi inline-ошибка в `selected` else-branch (`stress-popups.js`). */
  static FIELD_REQUIRED = 'Не заполнено поле!'

  /**
   * @param {boolean} hasSelection
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validateSelection(hasSelection) {
    const errors = []

    if (!hasSelection) {
      errors.push('empty')
    }

    return { isValid: errors.length === 0, errors }
  }
}
