import { RegisterAction } from './../../base';
import {
  SearchByCharCommand, SearchByNCharCommand, EasyMotionCharMoveActionBase, EasyMotionWordMoveActionBase, EasyMotionLineMoveActionBase
} from "./easymotion.cmd";



// EasyMotion n-char-move action

@RegisterAction
class EasyMotionNCharSearchCommand extends EasyMotionCharMoveActionBase {
  constructor() {
    super('/', new SearchByNCharCommand());
  }
}



// EasyMotion char-move actions

@RegisterAction
class ActionEasyMotionTwoCharSearchCommand extends EasyMotionCharMoveActionBase {
  constructor() {
    super('2s', new SearchByCharCommand({
      charCount: 2
    }));
  }
}

@RegisterAction
class ActionEasyMotionTwoCharFindForwardCommand extends EasyMotionCharMoveActionBase {
  constructor() {
    super('2f', new SearchByCharCommand({
      charCount: 2,
      searchOptions: "min"
    }));
  }
}

@RegisterAction
class ActionEasyMotionTwoCharFindBackwardCommand extends EasyMotionCharMoveActionBase {
  constructor() {
    super('2F', new SearchByCharCommand({
      charCount: 2,
      searchOptions: "max"
    }));
  }
}

@RegisterAction
class ActionEasyMotionTwoCharTilForwardCommand extends EasyMotionCharMoveActionBase {
  constructor() {
    super('2t', new SearchByCharCommand({
      charCount: 2,
      searchOptions: "min",
      labelPosition: "before"
    }));
  }
}

@RegisterAction
class ActionEasyMotionTwoCharTilBackwardCommand extends EasyMotionCharMoveActionBase {
  constructor() {
    super('2T', new SearchByCharCommand({
      charCount: 2,
      searchOptions: "max",
      labelPosition: "after"
    }));
  }
}

@RegisterAction
class ActionEasyMotionSearchCommand extends EasyMotionCharMoveActionBase {
  constructor() {
    super('s', new SearchByCharCommand({
      charCount: 1
    }));
  }
}

@RegisterAction
class ActionEasyMotionFindForwardCommand extends EasyMotionCharMoveActionBase {
  constructor() {
    super('f', new SearchByCharCommand({
      charCount: 1,
      searchOptions: "min"
    }));
  }
}

@RegisterAction
class ActionEasyMotionFindBackwardCommand extends EasyMotionCharMoveActionBase {
  constructor() {
    super('F', new SearchByCharCommand({
      charCount: 1,
      searchOptions: "max"
    }));
  }
}

@RegisterAction
class ActionEasyMotionTilForwardCommand extends EasyMotionCharMoveActionBase {
  constructor() {
    super('t', new SearchByCharCommand({
      charCount: 1,
      searchOptions: "min",
      labelPosition: "before"
    }));
  }
}

@RegisterAction
class ActionEasyMotionTilBackwardCommand extends EasyMotionCharMoveActionBase {
  constructor() {
    super('T', new SearchByCharCommand({
      charCount: 1,
      searchOptions: "max",
      labelPosition: "after"
    }));
  }
}



// EasyMotion word-move actions

@RegisterAction
class ActionEasyMotionWordCommand extends EasyMotionWordMoveActionBase {
  constructor() {
    super('w', { searchOptions: "min" });
  }
}

@RegisterAction
class ActionEasyMotionEndForwardCommand extends EasyMotionWordMoveActionBase {
  constructor() {
    super('e', {
      searchOptions: "min",
      labelPosition: "after"
    });
  };
}

@RegisterAction
class ActionEasyMotionEndBackwardCommand extends EasyMotionWordMoveActionBase {
  constructor() {
    super('ge', {
      searchOptions: "max",
      labelPosition: "after"
    });
  }
}

@RegisterAction
class ActionEasyMotionBeginningWordCommand extends EasyMotionWordMoveActionBase {
  constructor() {
    super('b', {
      searchOptions: "max"
    });
  }
}



// EasyMotion line-move actions

@RegisterAction
class ActionEasyMotionDownLines extends EasyMotionLineMoveActionBase {
  constructor() {
    super('j', {
      searchOptions: "min"
    });
  }
}


@RegisterAction
class ActionEasyMotionUpLines extends EasyMotionLineMoveActionBase {
  constructor() {
    super('k', {
      searchOptions: "max"
    });
  }
}



