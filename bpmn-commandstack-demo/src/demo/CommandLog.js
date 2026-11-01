/**
 * Панель «Журнал стека команд».
 *
 * Показывает:
 *  1) содержимое commandStack._stack — записи { command, id } и указатель
 *     _stackIdx (что можно отменить, а что повторить);
 *  2) трассу событий жизненного цикла последнего действия
 *     (preExecute → execute → executed → postExecute, revert/reverted).
 *
 * Читает приватные поля _stack, _stackIdx и _currentExecution — только
 * ради наглядности, в рабочем коде так делать не стоит.
 */

const PHASES = [
  'preExecute', 'execute', 'executed', 'postExecute', 'revert', 'reverted'
];

// у записей одной группы (один id) — один цвет
const GROUP_COLORS = [ '#0f766e', '#b45309', '#2f62b8', '#9d174d', '#4d7c0f', '#6d28d9' ];

export default function CommandLog(config, eventBus, commandStack) {
  this._commandStack = commandStack;
  this._stackEl = document.querySelector(config.stackContainer);
  this._traceEl = document.querySelector(config.traceContainer);
  this._trace = [];

  // Подписка на commandStack.<команда>.<фаза> для КАЖДОЙ зарегистрированной
  // команды. Именно эти события приходят первыми (раньше общих
  // commandStack.<фаза>), а высокий приоритет ставит нас в начало очереди —
  // поэтому в трассе фаза видна раньше вложенных команд, которые она запускает.
  // Обработчики команд Modeling регистрирует на 'diagram.init', поэтому
  // подписываемся после него (приоритет ниже 1000).
  eventBus.on('diagram.init', 100, () => {
    Object.keys(commandStack._handlerMap).forEach(command => {
      PHASES.forEach(phase => {
        eventBus.on(`commandStack.${ command }.${ phase }`, 10000, (event) => {
          this._trace.push({ phase, command, depth: this._depth(phase) });
        });
      });
    });
  });

  eventBus.on('elements.changed', 500, (event) => {
    this._trace.push({ phase: 'elements.changed', command: event.elements.length + ' эл.', depth: 0 });
  });

  // одно на всё действие: в конце execute / undo / redo / clear
  eventBus.on('commandStack.changed', 500, (event) => {
    this._renderStack();

    if (event.trigger !== 'clear') {
      this._renderTrace(event.trigger);
    }

    this._trace = [];
  });

  this._renderStack();
}

CommandLog.$inject = [ 'config.commandLog', 'eventBus', 'commandStack' ];

/**
 * Глубина вложенности команды.
 * execute() кладёт корневую команду в actions дважды (execute + _internalExecute),
 * каждая вложенная — ещё по два раза. При undo — один раз.
 */
CommandLog.prototype._depth = function(phase) {
  const length = this._commandStack._currentExecution.actions.length;

  if (phase === 'revert' || phase === 'reverted') {
    return 0;
  }

  return Math.max(0, Math.floor(length / 2) - 1);
};

CommandLog.prototype._renderStack = function() {
  if (!this._stackEl) {
    return;
  }

  const stack = this._commandStack._stack;
  const stackIdx = this._commandStack._stackIdx;

  if (!stack.length) {
    this._stackEl.innerHTML = '<p class="empty">Стек пуст. Сделайте что-нибудь на диаграмме.</p>';
    return;
  }

  const rows = stack.map((action, i) => {
    const undone = i > stackIdx;
    const color = GROUP_COLORS[action.id % GROUP_COLORS.length];
    const pointer = i === stackIdx ? '◀ _stackIdx' : '';

    return `<tr class="${ undone ? 'undone' : '' }">
      <td>${ i }</td>
      <td><span class="id" style="background:${ color }">${ action.id }</span></td>
      <td class="cmd">${ action.command }</td>
      <td class="ptr">${ pointer }</td>
    </tr>`;
  });

  this._stackEl.innerHTML = `
    <p class="meta">_stack.length = ${ stack.length }, _stackIdx = ${ stackIdx }</p>
    <table>
      <tr><th>#</th><th>id</th><th>команда</th><th></th></tr>
      ${ rows.join('') }
    </table>`;
};

CommandLog.prototype._renderTrace = function(trigger) {
  if (!this._traceEl) {
    return;
  }

  const lines = this._trace.map(entry => {
    const indent = '&nbsp;&nbsp;&nbsp;&nbsp;'.repeat(entry.depth);
    const cls = entry.phase === 'execute' || entry.phase === 'revert' ? 'core' : '';

    return `<div class="${ cls }">${ indent }<b>${ entry.phase }</b> ${ entry.command }</div>`;
  });

  this._traceEl.innerHTML = `<p class="meta">trigger: <b>${ trigger }</b></p>` + lines.join('');
};
