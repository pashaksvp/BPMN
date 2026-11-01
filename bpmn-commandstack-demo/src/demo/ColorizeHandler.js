import { getDi } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Своя команда `demo.colorize` — пример CommandHandler (паттерн «Команда»).
 *
 * Контекст: { elements: Shape[], color: string }
 *
 * execute() меняет цвет заливки в DI элемента и запоминает старый цвет
 * в контексте; revert() возвращает старый цвет. Оба метода возвращают
 * изменённые элементы — CommandStack пометит их как «грязные» (_markDirty)
 * и в конце одним событием `elements.changed` перерисует их.
 *
 * Вложенных команд здесь нет специально: это «чистая» пара execute/revert.
 */
export default function ColorizeHandler() {}

ColorizeHandler.$inject = [];

ColorizeHandler.prototype.canExecute = function(context) {
  return !!(context.elements && context.elements.length);
};

ColorizeHandler.prototype.execute = function(context) {
  const { elements, color } = context;

  // запоминаем старые цвета — они нужны для revert()
  context.oldColors = elements.map(element => getDi(element).get('color:background-color'));

  elements.forEach(element => {
    getDi(element).set('color:background-color', color);
  });

  return elements;
};

ColorizeHandler.prototype.revert = function(context) {
  const { elements, oldColors } = context;

  elements.forEach((element, i) => {
    getDi(element).set('color:background-color', oldColors[i]);
  });

  return elements;
};
