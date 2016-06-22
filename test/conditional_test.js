import test from 'ava';
import { make, makeFromConfig } from '../src';
import { makeSideEffectFunc } from './test-helpers';

const syncValidConditionFunc = () => true;
const syncInvalidConditionFunc = () => false;

const sync = {
  validConditionFunc: syncValidConditionFunc,
  invalidConditionFunc: syncInvalidConditionFunc,
  validCondition: { func: syncValidConditionFunc, params: [] },
  invalidCondition: { func: syncInvalidConditionFunc, params: [] }
};

const asyncValidConditionFunc = () => Promise.resolve('resolved');
const asyncInvalidConditionFunc = () => Promise.reject('rejected');

const async = {
  validConditionFunc: asyncValidConditionFunc,
  invalidConditionFunc: asyncInvalidConditionFunc,
  validCondition: { func: asyncValidConditionFunc, params: [] },
  invalidCondition: { func: asyncInvalidConditionFunc, params: [] },
};

const configs = {
  validCondition: {
    condition: { func: 'validConditionFunc', params: [] },
    action: { func: 'doSomething', params: ['something'] }
  },
  invalidCondition: {
    condition: { func: 'invalidConditionFunc', params: [] },
    action: { func: 'doSomething', params: ['something'] }
  }
};

const conditionFuncs = {
  validConditionFunc: syncValidConditionFunc,
  invalidConditionFunc: syncInvalidConditionFunc
};

const actionFuncs = {
  doSomething(something) { return `did ${something}` }
};

const undefinedAction = { func: 'undefinedFunc', params: ['none'] };

test.beforeEach(t => {
  t.context.sideEffectFunc = makeSideEffectFunc();
});

test('Synchronous conditional synchronously executes action for valid condition', t => {
  const {counter, func} = t.context.sideEffectFunc;
  const {condition, action} = make({
    condition: sync.validCondition,
    action: { func, params: ['val'] }
  });

  t.true(true);
  t.is(action, 'val');
  t.is(counter(), 1);
});

test('Synchronous conditional does not execute its action and returns undefined when condition not valid', t => {
  const {counter, func} = t.context.sideEffectFunc;
  const {condition, action} = make({
    condition: sync.invalidCondition,
    action: { func, params: ['val'] }
  });

  t.false(false);
  t.is(counter(), 0);
  t.is(action, undefined);
});

test('Async conditional executes its action when its condition promise resolves', async t => {
  const {counter, func} = t.context.sideEffectFunc;
  const {condition, action} = make({
    condition: async.validCondition,
    action: { func, params: ['val'] },
    async: true
  });

  try {
    let c = await condition;
    t.is(c, 'resolved');
  } catch(e) {
    t.fail();
  }

  try {
    let a = await action;
    t.is(a, 'val');
  } catch(e) {
    t.fail();
  }

  t.is(counter(), 1);
});

test('Async conditional does not execute its action when its condition promise is rejected', async t => {
  const {counter, func} = t.context.sideEffectFunc;
  const {condition, action} = make({
    condition: async.invalidCondition,
    action: { func, params: ['val'] },
    async: true
  });

  try {
    let c = await condition;
    t.fail();
  } catch(e) {
    t.is(e, 'rejected');
  }

  try {
    let a = await action;
    t.fail();
  } catch(e) {
    t.is(e, 'rejected');
  }

  t.is(counter(), 0);
});

test('makeFromConfig returns an object with properties for each config passed to it', t => {
  const {validCondition, invalidCondition} = makeFromConfig({configs, conditionFuncs, actionFuncs});

  t.true(validCondition.condition)
  t.is(validCondition.action, 'did something');

  t.false(invalidCondition.condition);
  t.is(invalidCondition.action, undefined);
});

test('makeFromConfig returns false if a synchronous config specifies an undefined actionFunc', t => {
  const confs = { validCondition: { ...configs.validCondition, action: undefinedAction } };
  const {validCondition} = makeFromConfig({configs: confs, conditionFuncs, actionFuncs});

  t.true(validCondition.condition);
  t.is(validCondition.action, undefined);
});

test('makeFromConfig returns a rejected Promise if an async config specifies an undefined actionFunc', t => {
  const confs = {
    validCondition: {
      ...configs.validCondition,
      action: undefinedAction,
      async: true
    }
  };

  const {validCondition} = makeFromConfig({configs: confs, conditionFuncs, actionFuncs});

  t.notThrows(validCondition.action);
});

test('makeFromConfig can handle async config with a valid condition', async t => {
  const {validCondition} = makeFromConfig({configs, conditionFuncs, actionFuncs});

  try {
    t.is(await validCondition.action, 'did something');
  } catch(e) {
    t.fail();
  }
});

test('makeFromConfig can handle async config with an invalid condition', t => {
  const confs = { invalidCondition: { ...configs.invalidCondition, async: true } };
  const condFuncs = { invalidConditionFunc: async.invalidConditionFunc };
  const {invalidCondition} = makeFromConfig({ configs: confs, conditionFuncs: condFuncs, actionFuncs });

  t.throws(invalidCondition.action);
});
