import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Правило: стартовое событие удалять нельзя.
 *
 * addRule вешает функцию на фазу canExecute (событие
 * `commandStack.elements.delete.canExecute`). Приоритет 2000 выше,
 * чем у стандартных BpmnRules (1000), поэтому наш ответ `false`
 * остановит проверку.
 *
 * ВАЖНО: правило спрашивают только UI-пути (клавиша Delete,
 * контекстное меню). Прямой вызов modeling.removeShape(...) его обходит,
 * потому что CommandStack.execute() не вызывает canExecute.
 */
export default class ProtectStartEventRules extends RuleProvider {

  static $inject = [ 'eventBus' ];

  init() {
    this.addRule('elements.delete', 2000, (context) => {
      const hasStart = context.elements.some(element => is(element, 'bpmn:StartEvent'));

      if (hasStart) {
        return false;
      }

      // undefined — «не моё дело», решают правила с меньшим приоритетом
    });
  }
}
