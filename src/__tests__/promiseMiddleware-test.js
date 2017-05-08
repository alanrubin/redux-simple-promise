import { spy } from 'sinon';
import 'babel-polyfill';
import promiseMiddleware, { resolve, reject, unresolve, unreject, REJECTED_NAME, RESOLVED_NAME } from '../';

function noop() {}
const GIVE_ME_META = 'GIVE_ME_META';
function metaMiddleware() {
  return next => action => (
    (action.type === GIVE_ME_META
      ? next({ ...action, meta: 'here you go' })
      : next(action))
  );
}

describe('before promiseMiddleware is called', () => {
  it('returns the rejected strings with default values', () => {
    expect(reject('MY_ACTION')).to.equal('MY_ACTION_REJECTED');
  });

  it('export the rejected name and resolved name strings with default values', () => {
    expect(RESOLVED_NAME).to.equal('_RESOLVED');
    expect(REJECTED_NAME).to.equal('_REJECTED');
  });
  it('returns the resolved strings with default values', () => {
    expect(resolve('MY_ACTION')).to.equal('MY_ACTION_RESOLVED');
  });
  it('returns the unrejected string with default values', () => {
    expect(unreject('MY_ACTION_REJECTED')).to.equal('MY_ACTION');
  });
  it('returns the unresolved string with default values', () => {
    expect(unresolve('MY_ACTION_RESOLVED')).to.equal('MY_ACTION');
  });
});

describe('promiseMiddleware', () => {
  let baseDispatch;
  let dispatch;
  let foobar;
  let err;

  beforeEach(() => {
    baseDispatch = spy();
    dispatch = function d(action) {
      const methods = { dispatch: d, getState: noop };
      return metaMiddleware()(promiseMiddleware()(methods)(baseDispatch))(action);
    };
    foobar = { foo: 'bar' };
    err = new Error();
  });
  it('dispatches first action before promise without arguments', () => {
    dispatch({
      type: 'ACTION_TYPE',
      payload: {
        promise: new Promise(() => {})
      }
    });

    expect(baseDispatch.calledOnce).to.be.true;

    expect(baseDispatch.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE'
    });
  });

  it('dispatches first action before promise with arguments', () => {
    dispatch({
      type: 'ACTION_TYPE',
      payload: {
        promise: new Promise(() => {}),
        foo: 'bar'
      }
    });

    expect(baseDispatch.calledOnce).to.be.true;

    expect(baseDispatch.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      payload: {
        foo: 'bar'
      }
    });
  });

  it('dispatches resolve action with arguments', async () => {
    await dispatch({
      type: 'ACTION_TYPE_RESOLVE',
      payload: {
        promise: Promise.resolve(foobar),
        foo2: 'bar2'
      }
    });

    expect(baseDispatch.calledTwice).to.be.true;

    expect(baseDispatch.secondCall.args[0]).to.deep.equal({
      type: resolve('ACTION_TYPE_RESOLVE'),
      payload: foobar,
      meta: {
        foo2: 'bar2'
      }
    });
  });

  it('dispatches reject action with arguments', async () => {
    await dispatch({
      type: 'ACTION_TYPE_REJECT',
      payload: {
        promise: Promise.reject(err),
        foo3: 'bar3',
        foo4: 'bar4'
      }
    });

    expect(baseDispatch.calledTwice).to.be.true;

    expect(baseDispatch.secondCall.args[0]).to.deep.equal({
      type: reject('ACTION_TYPE_REJECT'),
      payload: err,
      meta: {
        foo3: 'bar3',
        foo4: 'bar4'
      }
    });
  });

  it('returns the original promise from dispatch', () => {
    const promiseDispatched = new Promise(() => {});

    const dispatchedResult = dispatch({
      type: 'ACTION_TYPE_RESOLVE',
      payload: {
        promise: promiseDispatched,
        foo2: 'bar2'
      }
    });
    // Unable to compare promise directly for some reason, so comparing functions
    expect(dispatchedResult.then).to.be.equal(promiseDispatched.then);
  });

  it('resolves the original promise results from dispatch', () => {
    const promiseDispatched = Promise.resolve(foobar);

    const dispatchedResult = dispatch({
      type: 'ACTION_TYPE_RESOLVE',
      payload: {
        promise: promiseDispatched,
        foo2: 'bar2'
      }
    });
    expect(dispatchedResult).to.eventually.equal(foobar);
  });

  it('reject the original promise from dispatch', () => {
    const promiseDispatched = Promise.reject(err);

    const dispatchedResult = dispatch({
      type: 'ACTION_TYPE_REJECT',
      payload: {
        promise: promiseDispatched,
        foo2: 'bar2'
      }
    });
    expect(dispatchedResult).to.eventually.be.rejectedWith(err);
  });

  it('returns the reject and resolve strings with default values', () => {
    expect(resolve('MY_ACTION')).to.equal('MY_ACTION_RESOLVED');
    expect(reject('MY_ACTION')).to.equal('MY_ACTION_REJECTED');
  });

  it('ignores non-promises', async () => {
    dispatch(foobar);
    expect(baseDispatch.calledOnce).to.be.true;
    expect(baseDispatch.firstCall.args[0]).to.equal(foobar);

    dispatch({ type: 'ACTION_TYPE', payload: foobar });
    expect(baseDispatch.calledTwice).to.be.true;
    expect(baseDispatch.secondCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      payload: foobar
    });
  });

  it('starts async dispatches from beginning of middleware chain', async () => {
    dispatch({ type: GIVE_ME_META });
    dispatch({ type: GIVE_ME_META });
    expect(baseDispatch.args.map(args => args[0].meta)).to.eql([
      'here you go',
      'here you go'
    ]);
  });
});
