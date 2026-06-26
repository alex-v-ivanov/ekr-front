/**
 * Guard перед отправкой файла (п.19 §2).
 */
export class UploadFilePopUpValidator {

  /** Легаси `StressValidationMessages.COULD_NOT_SAVE_EXCEL_DATA` (`constants.js`). */
  static COULD_NOT_SAVE_EXCEL_DATA = 'Не удалось получить данные с метода SaveExcelDataSet'

  /**
   * @param {HTMLInputElement|null|undefined} fileInput
   * @param {string} excelNameValue
   * @returns {{
   *   isValid: boolean,
   *   missingExcelName: boolean,
   *   missingFile: boolean,
   * }}
   */
  validateBeforeSend(fileInput, excelNameValue) {
    const hasFile = (fileInput?.files?.length || 0) > 0
    const hasName = excelNameValue !== ''

    if (hasFile && hasName) {
      return {
        isValid: true,
        missingExcelName: false,
        missingFile: false,
      }
    }

    return {
      isValid: false,
      missingExcelName: excelNameValue === '',
      missingFile: !hasFile,
    }
  }
}
