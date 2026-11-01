import BpmnModeler from 'bpmn-js/lib/Modeler';
import { is } from 'bpmn-js/lib/util/ModelUtil';

import DemoModule from './demo';

const fmt = (allowed) => Array.isArray(allowed) ? '[' + allowed.map(e => e.id).join(', ') + ']' : String(allowed);

const COLORS = [ '#bbf7d0', '#fde68a', '#bfdbfe', '#fbcfe8' ];

export async function start(diagramXML) {

  const modeler = new BpmnModeler({
    container: '#canvas',
    additionalModules: [ DemoModule ],
    commandLog: { stackContainer: '#stack', traceContainer: '#trace' }
  });

  // для экспериментов в консоли DevTools: modeler.get('commandStack')._stack
  window.modeler = modeler;

  const commandStack = modeler.get('commandStack');
  const modeling = modeler.get('modeling');
  const elementFactory = modeler.get('elementFactory');
  const elementRegistry = modeler.get('elementRegistry');
  const canvas = modeler.get('canvas');
  const selection = modeler.get('selection');
  const editorActions = modeler.get('editorActions');
  const rules = modeler.get('rules');

  const statusEl = document.querySelector('#status');
  const status = (text) => { statusEl.textContent = text; };

  let colorIdx = 0;
  let taskX = 320;

  async function load() {
    await modeler.importXML(diagramXML);
    canvas.zoom('fit-viewport', 'auto');
    taskX = 320;
    status('Диаграмма загружена. Стек очищен (commandStack.clear).');
  }

  const on = (id, fn) => document.querySelector(id).addEventListener('click', fn);

  // 1. Создание: shape.create + вложенная element.updateLabel от AutoNameBehavior
  on('#btn-create', () => {
    const shape = elementFactory.createShape({ type: 'bpmn:Task' });

    modeling.createShape(shape, { x: taskX, y: 360 }, canvas.getRootElement());
    taskX += 140;

    status('modeling.createShape → shape.create; AutoNameBehavior в postExecute дал имя (вложенная команда).');
  });

  // 2. Сценарий диаграммы последовательности «Удаление задачи»
  on('#btn-delete-task', () => {
    const task = elementRegistry.get('Task_Check');

    if (!task) {
      return status('Задачи «Проверить заявку» уже нет — нажмите Undo или Сброс.');
    }

    modeling.removeShape(task);
    status('modeling.removeShape → shape.delete. Смотрите вложенные команды с тем же id в стеке.');
  });

  // 3. Удаление через UI-путь: EditorActions спрашивает rules.allowed
  on('#btn-delete-ui', () => {
    const selected = selection.get();

    if (!selected.length) {
      return status('Сначала выделите элемент на диаграмме.');
    }

    const allowed = rules.allowed('elements.delete', { elements: selected });

    editorActions.trigger('removeSelection');

    status(`rules.allowed('elements.delete') = ${ fmt(allowed) }` +
      (allowed === false ? ' → удаление запрещено правилом ProtectStartEventRules.' : ' → удалено.'));
  });

  // 4. Ограничение: прямой вызов обходит правила
  on('#btn-delete-start', () => {
    const start = elementRegistry.find(element => is(element, 'bpmn:StartEvent') && !element.labelTarget);

    if (!start) {
      return status('Стартового события нет — нажмите Undo.');
    }

    const allowed = rules.allowed('elements.delete', { elements: [ start ] });

    modeling.removeShape(start);

    status(`rules.allowed = ${ fmt(allowed) }, но modeling.removeShape удалил старт: CommandStack.execute правила не проверяет.`);
  });

  // 5. Своя команда demo.colorize
  on('#btn-colorize', () => {
    const elements = selection.get().filter(element => !element.waypoints && !element.labelTarget);

    if (!elements.length) {
      return status('Выделите одну или несколько фигур.');
    }

    const color = COLORS[colorIdx++ % COLORS.length];

    commandStack.execute('demo.colorize', { elements, color });
    status(`commandStack.execute('demo.colorize', { color: '${ color }' }) — своя команда, отменяется через Undo.`);
  });

  on('#btn-undo', () => {
    if (!commandStack.canUndo()) {
      return status('Отменять нечего.');
    }

    commandStack.undo();
    status('commandStack.undo(): откатаны все записи с одинаковым id.');
  });

  on('#btn-redo', () => {
    if (!commandStack.canRedo()) {
      return status('Повторять нечего.');
    }

    commandStack.redo();
    status('commandStack.redo(): pre/postExecute при повторе не вызываются.');
  });

  on('#btn-reset', load);

  await load();

  return modeler;
}
