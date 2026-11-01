import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Перехватчик (CommandInterceptor): после создания задачи без имени
 * даёт ей имя «Задача N».
 *
 * Подписка идёт на событие `commandStack.shape.create.postExecute`.
 * В фазе postExecute можно запускать другие команды — modeling.updateLabel
 * выполнит вложенную команду `element.updateLabel`. Она получит тот же id,
 * что и `shape.create`, поэтому один Ctrl+Z отменит и имя, и создание.
 */
export default class AutoNameBehavior extends CommandInterceptor {

  static $inject = [ 'eventBus', 'modeling', 'elementRegistry' ];

  constructor(eventBus, modeling, elementRegistry) {
    super(eventBus);

    this.postExecute('shape.create', (event) => {
      const shape = event.context.shape;

      if (!is(shape, 'bpmn:Task') || getBusinessObject(shape).name) {
        return;
      }

      const count = elementRegistry.filter(element => is(element, 'bpmn:Task')).length;

      modeling.updateLabel(shape, 'Задача ' + count);
    });
  }
}
