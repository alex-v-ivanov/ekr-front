/**
 * Локальная валидация выбора в модалке подбора распределения (п.16).
 */
export class SelectDistributionValidator {

  /** Легаси `StressValidationMessages.COULD_NOT_GET_DISTRIBUTION_DATA`. */
  static COULD_NOT_GET_DISTRIBUTION_DATA = 'Не удалось получить данные с метода GetDistributionData'

  /** Легаси `StressValidationMessages.COULD_NOT_GET_CHOICE_DISTRIBUTION`. */
  static COULD_NOT_GET_CHOICE_DISTRIBUTION = 'Не удалось получить данные с метода ChoiceDistribution'

  /** Легаси `StressValidationMessages.SOMETHING_WENT_WRONG`. */
  static SOMETHING_WENT_WRONG = 'Что-то пошло не так!'

  /** Легаси `StressValidationMessages.ERROR_COLON`. */
  static ERROR_COLON = 'Ошибка:'

  /** Легаси `StressValidationMessages.DATA_NOT_FOUND`. */
  static DATA_NOT_FOUND = 'Данные не найдены'

  /** Легаси `StressValidationMessages.CONFIRM_ADD_ALL_INDICATORS`. */
  static CONFIRM_ADD_ALL_INDICATORS = 'Вы уверены, что хотите добавить все показатели?'

  /** Легаси `StressValidationMessages.DISTRIBUTION_LIST_EMPTY`. */
  static DISTRIBUTION_LIST_EMPTY = 'Список распределений пуст.'

  /** Легаси `StressValidationMessages.PARAM_NOT_SELECTED` (§5.4). */
  static PARAM_NOT_SELECTED = 'Параметр не выбран!'

  /** Легаси `StressValidationMessages.CONFIRM_DELETE_CALC_INDICATOR` (§4.7). */
  static CONFIRM_DELETE_CALC_INDICATOR = 'Вы уверены, что хотите удалить расчет показателя?'

  /** Легаси `StressValidationMessages.CONFIRM_DELETE_ALL_RECORDS` (§4.8). */
  static CONFIRM_DELETE_ALL_RECORDS = 'Вы уверены, что хотите удалить все записи?'

  /**
   * @param {*} selection — выбранная строка таблицы
   * @returns {{ isValid: boolean, errors: Array }}
   */
  validate(selection) {
    const errors = []

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * @param {string|null} distType — выбранная radio-строка
   * @returns {{ ok: boolean, message?: string }}
   */
  validateChooseDistribution(distType) {
    if (!distType) {
      return { ok: false, message: SelectDistributionValidator.PARAM_NOT_SELECTED }
    }

    return { ok: true }
  }
}
