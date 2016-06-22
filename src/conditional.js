import { Promise } from 'es6-promise';

/**
 * When an async condition is invalid, both the condition and action properties
 * of the returned object will be set to the rejected promise from the condition
 * function supplied by the developer. When an async condition is undefined,
 * the returned condition and action will be set to a rejected promise.
 */
export function make({condition, action, async = false}) {
  let conditionResult = execFunc(condition.func, condition.params);
  let actionResult;

  if (async) {

    try {
      actionResult = conditionResult
        .then(() => execFunc(action.func, action.params));
    } catch(e) {
      actionResult = Promise.reject();
    }

  } else {

    actionResult =  conditionResult ? execFunc(action.func, action.params) : undefined;

  }

  return {condition: conditionResult, action: actionResult};
}

export function makeFromConfig({configs, conditionFuncs, actionFuncs}) {
  let result = {};

  for (let k in configs) {

    let config = configs[k];
    let conditionConfig = config.condition;
    let conditionFunc = conditionFuncs[conditionConfig.func];
    let actionConfig = config.action;
    let actionFunc = actionFuncs[actionConfig.func];
    let async = config.async || false;
    let condition = {func: conditionFunc, params: conditionConfig.params};
    let action = {func: actionFunc, params: actionConfig.params};

    result[k] = make({condition, action, async});

  }

  return result;
}

function execFunc(func, params) {
  try {
    return func.apply(null, params);
  } catch(e) {
    return undefined;
  }
}
