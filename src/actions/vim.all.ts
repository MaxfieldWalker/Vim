/**
 * Make sure they are all loaded.
 */
import './base';
import './operator';
import './motion';
import './textobject';

// commands
import './commands/insert';

/**
 * Plugins
 */

// easymotion
import './plugins/easymotion/easymotion.cmd';
import './plugins/easymotion/registerMoveActions';
// surround
import './plugins/surround';
