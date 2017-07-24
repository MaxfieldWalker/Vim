import { EasyMotion } from './easymotion';
import { Position } from './../../../common/motion/position';
import { ModeName } from './../../../mode/mode';
import { Configuration } from './../../../configuration/configuration';
import { BaseCommand } from './../../commands/actions';
import { RegisterAction } from './../../base';
import { VimState } from './../../../mode/modeHandler';
import { SearchState, SearchDirection } from './../../../state/searchState';


abstract class BaseEasyMotionCommand extends BaseCommand {
  public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];

  public abstract getMatches(position: Position, vimState: VimState): EasyMotion.Match[];


  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return match.position;
  }

  public processMarkers(matches: EasyMotion.Match[], position: Position, vimState: VimState) {
    // Clear existing markers, just in case
    vimState.easyMotion.clearMarkers();

    let index = 0;
    for (const match of matches) {
      const pos = this.getMatchPosition(match, position, vimState);

      if (!match.position.isEqual(position)) {
        const marker = EasyMotion.generateMarker(index++, matches.length, position, pos);
        if (marker) {
          vimState.easyMotion.addMarker(marker);
        }
      }
    }
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // Only execute the action if the configuration is set
    if (!Configuration.easymotion) {
      return vimState;
    } else {
      // Search all occurences of the character pressed
      const matches = this.getMatches(position, vimState);

      // Stop if there are no matches
      if (matches.length === 0) {
        return vimState;
      } else {
        vimState.easyMotion = new EasyMotion();
        this.processMarkers(matches, position, vimState);

        if (matches.length === 1) {
          // Only one found, navigate to it
          const marker = vimState.easyMotion.markers[0];
          // Set cursor position based on marker entered
          vimState.cursorPosition = marker.position;
          vimState.easyMotion.clearDecorations();
          return vimState;
        } else {
          // Store mode to return to after performing easy motion
          vimState.easyMotion.previousMode = vimState.currentMode;
          // Enter the EasyMotion mode and await further keys
          vimState.currentMode = ModeName.EasyMotionMode;
          return vimState;
        }
      }
    }
  }
}

function createCommandKeys(command: { trigger: string[], charCount: number }): string[] {
  return ['<leader>', '<leader>', ...command.trigger, ...Array(command.charCount).fill('<character>')];
}

function getMatchesForChar(
  position: Position,
  vimState: VimState,
  searchChar: string,
  options?: EasyMotion.SearchOptions): EasyMotion.Match[] {
  // Search all occurences of the character pressed
  if (searchChar === ' ') {
    // Searching for space should only find the first space
    return vimState.easyMotion.sortedSearch(position, new RegExp(' {1,}', 'g'), options);
  } else {
    const ignorecase = Configuration.ignorecase && !(Configuration.smartcase && /[A-Z]/.test(searchChar));
    const regexFlags = ignorecase ? 'gi' : 'g';
    return vimState.easyMotion.sortedSearch(position, new RegExp(searchChar, regexFlags), options);
  }
}

function getMatchesForWord(position: Position, vimState: VimState, options?: EasyMotion.SearchOptions): EasyMotion.Match[] {
  // Search for the beginning of all words after the cursor
  return vimState.easyMotion.sortedSearch(position, new RegExp('\\w{1,}', 'g'), options);
}

function getMatchesForLineStart(position: Position, vimState: VimState, options?: EasyMotion.SearchOptions): EasyMotion.Match[] {
  // Search for the beginning of all non whitespace chars on each line before the cursor
  const matches = vimState.easyMotion.sortedSearch(position, new RegExp('^.', 'gm'), options);
  for (const match of matches) {
    match.position = match.position.getFirstLineNonBlankChar();
  }
  return matches;
}

export interface AfterSearchStringInputAction {
  shouldFire(): boolean;
  updateSearchString(s: string): void;
  fire(position: Position, vimState: VimState): Promise<VimState>;
}

export class SearchByCharCommand extends BaseEasyMotionCommand implements AfterSearchStringInputAction {
  private _charCount: number;
  private _searchString: string;

  constructor(charCount: number) {
    super();
    this._charCount = charCount;
  }

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForChar(position, vimState, this._searchString, this.searchOptions(position));
  }

  protected searchOptions(position: Position): EasyMotion.SearchOptions {
    return {};
  }

  public updateSearchString(s: string) {
    this._searchString = s;
  }

  /**
   * True if it should go to Easymotion mode
   */
  public shouldFire() {
    return this._searchString.length >= this._charCount;
  }

  public fire(position: Position, vimState: VimState) {
    return this.exec(position, vimState);
  }
}

class RegisterSearchByCharCommand extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  private _command: AfterSearchStringInputAction;

  constructor(trigger: string, command: AfterSearchStringInputAction) {
    super();
    this._command = command;
    this.keys = ['<leader>', '<leader>', ...trigger.split('')];
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.easyMotion = new EasyMotion();
    vimState.easyMotion.previousMode = vimState.currentMode;
    vimState.easyMotion.command = this._command;

    vimState.currentMode = ModeName.EasyMotionInputMode;
    return vimState;
  }
}

@RegisterAction
class Easymotion2s extends RegisterSearchByCharCommand { constructor() { super('2s', new SearchByCharCommand(2)); } }

class ActionEasyMotionTwoCharFindForwardCommand extends SearchByCharCommand {
  constructor() { super(2); }

  protected searchOptions(position: Position): EasyMotion.SearchOptions {
    return { min: position };
  }
}
@RegisterAction
class EasyMotion2f extends RegisterSearchByCharCommand { constructor() { super('2f', new ActionEasyMotionTwoCharFindForwardCommand()); } }

class ActionEasyMotionTwoCharFindBackwardCommand extends SearchByCharCommand {
  constructor() { super(2); }

  protected searchOptions(position: Position): EasyMotion.SearchOptions {
    return { max: position };
  }
}
@RegisterAction
class Easymotion2F extends RegisterSearchByCharCommand { constructor() { super('2F', new ActionEasyMotionTwoCharFindBackwardCommand()); } }

class ActionEasyMotionTwoCharTilForwardCommand extends SearchByCharCommand {
  constructor() { super(2); }

  protected searchOptions(position: Position): EasyMotion.SearchOptions {
    return { min: position };
  }

  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return new Position(match.position.line, Math.max(0, match.position.character - 1));
  }
}
@RegisterAction
class Easymotion2t extends RegisterSearchByCharCommand { constructor() { super('2t', new ActionEasyMotionTwoCharTilForwardCommand()); } }

class ActionEasyMotionTwoCharTilBackwardCommand extends SearchByCharCommand {
  constructor() { super(2); }

  protected searchOptions(position: Position): EasyMotion.SearchOptions {
    return { max: position };
  }

  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return new Position(match.position.line, Math.max(0, match.position.character + 2));
  }
}
@RegisterAction
class Easymotion2T extends RegisterSearchByCharCommand { constructor() { super('2T', new ActionEasyMotionTwoCharTilBackwardCommand()); } }

@RegisterAction
class Easymotions extends RegisterSearchByCharCommand { constructor() { super('s', new SearchByCharCommand(1)); } }

class ActionEasyMotionFindForwardCommand extends SearchByCharCommand {
  constructor() { super(1); }

  protected searchOptions(position: Position): EasyMotion.SearchOptions {
    return { min: position };
  }
}
@RegisterAction
class Easymotionf extends RegisterSearchByCharCommand { constructor() { super('f', new ActionEasyMotionFindForwardCommand()); } }

class ActionEasyMotionFindBackwardCommand extends SearchByCharCommand {
  constructor() { super(1); }

  protected searchOptions(position: Position): EasyMotion.SearchOptions {
    return { max: position };
  }
}
@RegisterAction
class EasymotionF extends RegisterSearchByCharCommand { constructor() { super('F', new ActionEasyMotionFindBackwardCommand()); } }

class ActionEasyMotionTilForwardCommand extends SearchByCharCommand {
  constructor() { super(1); }

  protected searchOptions(position: Position): EasyMotion.SearchOptions {
    return { min: position };
  }

  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return new Position(match.position.line, Math.max(0, match.position.character - 1));
  }
}
@RegisterAction
class Easymotiont extends RegisterSearchByCharCommand { constructor() { super('t', new ActionEasyMotionTilForwardCommand()); } }

class ActionEasyMotionTilBackwardCommand extends SearchByCharCommand {
  constructor() { super(1); }

  protected searchOptions(position: Position): EasyMotion.SearchOptions {
    return { max: position };
  }

  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return new Position(match.position.line, Math.max(0, match.position.character + 1));
  }
}
@RegisterAction
class EasymotionT extends RegisterSearchByCharCommand { constructor() { super('T', new ActionEasyMotionTilBackwardCommand()); } }


@RegisterAction
class ActionEasyMotionWordCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['w'], charCount: 0 });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForWord(position, vimState, { min: position });
  }
}

@RegisterAction
class ActionEasyMotionEndForwardCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['e'], charCount: 0 });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForWord(position, vimState, { min: position });
  }

  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return new Position(match.position.line, match.position.character + match.text.length - 1);
  }
}

@RegisterAction
class ActionEasyMotionEndBackwardCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['g', 'e'], charCount: 0 });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForWord(position, vimState, { max: position });
  }

  public getMatchPosition(
    match: EasyMotion.Match,
    position: Position,
    vimState: VimState
  ): Position {
    return new Position(match.position.line, match.position.character + match.text.length - 1);
  }
}

@RegisterAction
class ActionEasyMotionBeginningWordCommand extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['b'], charCount: 0 });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForWord(position, vimState, { max: position });
  }
}

@RegisterAction
class ActionEasyMotionDownLines extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['j'], charCount: 0 });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForLineStart(position, vimState, { min: position });
  }
}

@RegisterAction
class ActionEasyMotionUpLines extends BaseEasyMotionCommand {
  keys = createCommandKeys({ trigger: ['k'], charCount: 0 });

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForLineStart(position, vimState, { max: position });
  }
}



@RegisterAction
class EasyMotionNCharInputMode extends BaseCommand {
  modes = [ModeName.EasyMotionInputMode];
  keys = ['<character>'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const key = this.keysPressed[0];
    const searchState = vimState.globalState.searchState;
    const searchString = vimState.easyMotion.searchStringAccumulation;
    if (key === '<BS>' || key === '<shift+BS>') {
      if (searchState) {
        searchState.searchString = searchString.slice(0, -1);
      }
      vimState.easyMotion.searchStringAccumulation = searchString.slice(0, -1);
    } else {
      if (searchState) {
        searchState.searchString += key;
      }
      vimState.easyMotion.searchStringAccumulation += key;
    }
    const s = searchString + key;
    const cmd = vimState.easyMotion.command;
    cmd.updateSearchString(s);
    if (cmd.shouldFire()) {
      // Skip Easymotion input mode to make sure not to back to it
      vimState.currentMode = vimState.easyMotion.previousMode;
      const state = await cmd.fire(vimState.cursorPosition, vimState);
      return state;
    }
    return vimState;
  }
}

@RegisterAction
class CommandEscEasyMotionNCharInputMode extends BaseCommand {
  modes = [ModeName.EasyMotionInputMode];
  keys = ['<Esc>'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Normal;
    vimState.globalState.searchState = undefined;
    return vimState;
  }
}

class SearchByNCharCommand extends BaseEasyMotionCommand implements AfterSearchStringInputAction {
  private _searchString: string;

  constructor() { super(); }

  public updateSearchString(s: string) {
    this._searchString = s;
  }

  public getMatches(position: Position, vimState: VimState): EasyMotion.Match[] {
    return getMatchesForChar(position, vimState, this.removeTrailingLineBreak(this._searchString), {});
  }

  private removeTrailingLineBreak(s: string) {
    return s.replace(new RegExp("\n+$", "g"), "");
  }

  public shouldFire() {
    // Fire if <CR> typed
    return this._searchString.endsWith("\n");
  }

  public async fire(position: Position, vimState: VimState) {
    if (this.removeTrailingLineBreak(this._searchString) === '') {
      return vimState;
    } else {
      return this.exec(position, vimState);
    }
  }
}
@RegisterAction
class EasyMotionNCharSearchCommand extends RegisterSearchByCharCommand {
  constructor() { super('/', new SearchByNCharCommand()); }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.globalState.searchState = new SearchState(
      SearchDirection.Forward,
      vimState.cursorPosition,
      '',
      { isRegex: true },
      vimState.currentMode
    );
    vimState.globalState.hl = true;
    return super.exec(position, vimState);
  }
}

@RegisterAction
class MoveEasyMotion extends BaseCommand {
  modes = [ModeName.EasyMotionMode];
  keys = ['<character>'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const key = this.keysPressed[0];
    if (!key) {
      return vimState;
    } else {
      // "nail" refers to the accumulated depth keys
      const nail = vimState.easyMotion.accumulation + key;
      vimState.easyMotion.accumulation = nail;

      // Find markers starting with "nail"
      const markers = vimState.easyMotion.findMarkers(nail, true);

      // If previous mode was visual, restore visual selection
      if (
        vimState.easyMotion.previousMode === ModeName.Visual ||
        vimState.easyMotion.previousMode === ModeName.VisualLine ||
        vimState.easyMotion.previousMode === ModeName.VisualBlock
      ) {
        vimState.cursorStartPosition = vimState.lastVisualSelectionStart;
        vimState.cursorPosition = vimState.lastVisualSelectionEnd;
      }

      if (markers.length === 1) {
        // Only one found, navigate to it
        const marker = markers[0];

        vimState.easyMotion.clearDecorations();
        // Restore the mode from before easy motion
        vimState.currentMode = vimState.easyMotion.previousMode;

        // Set cursor position based on marker entered
        vimState.cursorPosition = marker.position;

        return vimState;
      } else {
        if (markers.length === 0) {
          // None found, exit mode
          vimState.easyMotion.clearDecorations();
          vimState.currentMode = vimState.easyMotion.previousMode;
          return vimState;
        } else {
          return vimState;
        }
      }
    }
  }
}
