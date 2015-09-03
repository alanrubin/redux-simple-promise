import { isFSA } from 'flux-standard-action';

function isPromise(val) {
  return val && typeof val.then === 'function';
}

export default function promiseMiddleware({ dispatch }) {
  return next => action => {
    if (!isFSA(action)) {
      return isPromise(action)
        ? action.then(dispatch)
        : next(action);
    }

    if (!action.payload || !isPromise(action.payload.promise)) {
      return next(action);
    }

    // Our promise

    // (1) Dispatch actionName with payload with arguments apart from promise

    // Clone original action
    let newAction = { ...action };

    if (Object.keys(newAction.payload).length === 1) {
      // No arguments beside promise, remove all payload
      delete newAction.payload; 
    } else {
      // Other arguments, delete promise only
      delete newAction.payload.promise;
    }

    dispatch(newAction);


    // return isPromise(action.payload)
    //   ? action.payload.then(
    //       result => dispatch({ ...action, payload: result }),
    //       error => dispatch({ ...action, payload: error, error: true })
    //     )
    //   : next(action);
  };
}

export function resolve(actionName) {
  return actionName + '_RESOLVE';
}

export function reject(actionName) {
  return actionName + '_REJECT';
}
