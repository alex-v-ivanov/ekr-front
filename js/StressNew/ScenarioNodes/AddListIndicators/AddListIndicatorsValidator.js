/**
 * Локальные проверки попапа «Добавить список» перед copy.
 * Без jQuery, без `StressApi` — чистые правила над данными формы.
 */
export class AddListIndicatorsValidator {

  /** Легаси `copy()` else-branch (`stress-add-list.js`). */
  static FIELD_REQUIRED = 'Не заполнено поле!'

  /** @returns {string} */
  getFieldRequiredMessage() {
    return AddListIndicatorsValidator.FIELD_REQUIRED
  }

  /**
   * @param {*} selectedVersionId — id выбранной версии стресс-теста
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validateVersionSelected(selectedVersionId) {
    const errors = []

    if (selectedVersionId == null || String(selectedVersionId) === '') {
      errors.push(this.getFieldRequiredMessage())
    }

    return { isValid: errors.length === 0, errors }
  }
}
