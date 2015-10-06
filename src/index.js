import { isFSA } from 'flux-standard-action';

function isPromise(val) {
  return val && typeof val.then === 'function';
}

let [RESOLVED_NAME, REJECTED_NAME] = ['_RESOLVED', '_REJECTED'];

export function resolve(actionName) {
  return actionName + RESOLVED_NAME;
}

export function reject(actionName) {
  return actionName + REJECTED_NAME;
}

export default function promiseMiddleware(resolvedName, rejectedName) {
  [RESOLVED_NAME, REJECTED_NAME] = [resolvedName || RESOLVED_NAME, rejectedName || REJECTED_NAME];

  return ({ dispatch }) => next => action => {

    if (!isFSA(action) || !action.payload || !isPromise(action.payload.promise)) {
      return next(action);
    }

    // (1) Dispatch actionName with payload with arguments apart from promise

    // Clone original action
    let newAction = {
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

    // Create a base for the next action containing the metadata.
    let nextActionBase = {
      meta: {
        ...action.meta,
        payload: {
          ...newAction.payload
        }
      }
    };

    if (Object.keys(nextActionBase.meta.payload).length === 0) {
      // No arguments were given beside the promise, no need to include them
      // in the meta.
      delete nextActionBase.meta.payload;
    }
    if (Object.keys(nextActionBase.meta).length === 0) {
      // No meta was included either, remove all meta.
      delete nextActionBase.meta;
    }

    // (2) Listen to promise and dispatch payload with new actionName
    return action.payload.promise.then(
      (result) => {
        dispatch({
          type: resolve(action.type, resolvedName),
          payload: result,
          ...nextActionBase
        });
        return result;
      },
      (error) => {
        dispatch({
          type: reject(action.type, rejectedName),
          payload: error,
          ...nextActionBase
        });
        throw error;
      }
    );
  };
}
