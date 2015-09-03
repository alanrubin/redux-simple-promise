import { isFSA } from 'flux-standard-action';

function isPromise(val) {
  return val && typeof val.then === 'function';
}

export function resolve(actionName) {
  return actionName + '_RESOLVE';
}

export function reject(actionName) {
  return actionName + '_REJECT';
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

    // (2) Listen to promise and dispatch payload with new actionName
    action.payload.promise.then(
      (result) => {
        dispatch({
          type: resolve(action.type),
          payload: {
            // newAction payload without promise, only with original arguments, delete on last step
            ...newAction.payload,
            promise: result
          }
        });
      },
      (error) => {
        dispatch({
          type: reject(action.type),
          payload: {
            // newAction payload without promise, only with original arguments, delete on last step
            ...newAction.payload,
            promise: error
          }
        });
      }
    );


    // return isPromise(action.payload)
    //   ? action.payload.then(
    //       result => dispatch({ ...action, payload: result }),
    //       error => dispatch({ ...action, payload: error, error: true })
    //     )
    //   : next(action);
  };
}
