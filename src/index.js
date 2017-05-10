import { isFSA } from 'flux-standard-action';

function isPromise(val) {
  return val && typeof val.then === 'function';
}

export const RESOLVED_NAME = '_RESOLVED';
export const REJECTED_NAME = '_REJECTED';

export const resolve = (actionName, resolvedName = RESOLVED_NAME) => actionName + resolvedName;

export const reject = (actionName, rejectedName = REJECTED_NAME) => actionName + rejectedName;

export const unresolve = (actionName, resolvedName = RESOLVED_NAME) => actionName.replace(resolvedName, '');

export const unreject = (actionName, rejectedName = REJECTED_NAME) => actionName.replace(rejectedName, '');

export function createPromiseMiddleware(resolvedName = RESOLVED_NAME, rejectedName = REJECTED_NAME) {
  const middleware = ({ dispatch }) => next => (action) => {

    if (!isFSA(action) || !action.payload || !isPromise(action.payload.promise)) {
      return next(action);
    }

    // (1) Dispatch actionName with payload with arguments apart from promise

    // Clone original action
    const newAction = {
      type: action.type,
      payload: {
        ...action.payload
      }
    };

    if (Object.keys(newAction.payload).length === 1) {
      // No arguments beside promise, remove all payload
      delete newAction.payload;
    } else {
      // Other arguments, delete promise only
      delete newAction.payload.promise;
    }

    dispatch(newAction);

    // (2) Listen to promise and dispatch payload with new actionName
    return action.payload.promise.then(
      (result) => {
        dispatch({
          type: resolve(action.type, resolvedName),
          payload: result,
          meta: newAction.payload
        });
        return result;
      },
      (error) => {
        dispatch({
          type: reject(action.type, rejectedName),
          payload: error,
          meta: newAction.payload
        });
        return error;
      }
    );
  };

  middleware.RESOLVED_NAME = resolvedName;
  middleware.REJECTED_NAME = rejectedName;

  middleware.resolve = actionName => resolve(actionName, resolvedName);
  middleware.reject = actionName => reject(actionName, rejectedName);
  middleware.unresolve = actionName => unresolve(actionName, resolvedName);
  middleware.unreject = actionName => unreject(actionName, rejectedName);

  return middleware;
}

export default createPromiseMiddleware();