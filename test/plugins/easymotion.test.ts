import { setupWorkspace, cleanUpWorkspace } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';
import { getAndUpdateModeHandler } from '../../extension';

suite('easymotion plugin', () => {
  let modeHandler: ModeHandler;
  let { newTest, newTestOnly } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace('.js');
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'Can handle s move',
    start: ['a|bcdabcd'],
    keysPressed: '<leader><leader>sas',
    end: ['|abcdabcd'],
  });

  newTest({
    title: 'Can handle 2s move',
    start: ['ab|cdabcd'],
    keysPressed: '<leader><leader>2sabs',
    end: ['|abcdabcd'],
  });
});
