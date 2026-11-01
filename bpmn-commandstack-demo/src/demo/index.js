import AutoNameBehavior from './AutoNameBehavior';
import ProtectStartEventRules from './ProtectStartEventRules';
import ColorizeHandler from './ColorizeHandler';
import CommandLog from './CommandLog';

/**
 * Модуль didi, который подключается через
 * new BpmnModeler({ additionalModules: [ DemoModule ] }).
 *
 * __init__ — сервисы, которые нужно создать сразу при старте редактора.
 */
export default {
  __init__: [
    'autoNameBehavior',
    'protectStartEventRules',
    'commandLog',
    [ 'commandStack', function(commandStack) {

      // регистрация своей команды: CommandStack сам создаст
      // ColorizeHandler через injector.instantiate
      commandStack.registerHandler('demo.colorize', ColorizeHandler);
    } ]
  ],
  autoNameBehavior: [ 'type', AutoNameBehavior ],
  protectStartEventRules: [ 'type', ProtectStartEventRules ],
  commandLog: [ 'type', CommandLog ]
};
