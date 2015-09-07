redux-simple-promise
=============

[![build status](https://img.shields.io/travis/alanrubin/redux-simple-promise/master.svg?style=flat-square)](https://travis-ci.org/alanrubin/redux-simple-promise)
[![npm version](https://img.shields.io/npm/v/redux-simple-promise.svg?style=flat-square)](https://www.npmjs.com/package/redux-simple-promise)

[FSA](https://github.com/acdlite/flux-standard-action)-compliant promise [middleware](http://rackt.github.io/redux/docs/advanced/Middleware.html) for Redux with simple behaviour with minimal boilerplate declarations.

```js
npm install --save redux-simple-promise
```

## Usage

First, import the middleware creator and include it in `applyMiddleware` when creating the Redux store. **You need to call it as a function (See later why on configuration section below):**

```js
import promiseMiddleware from 'redux-simple-promise';

composeStoreWithMiddleware = applyMiddleware(
  promiseMiddleware()
)(createStore);

```

To use the middleware, dispatch a `promise` property and optional additional properties within the `payload` of the action and specify the action `type` string as you normally do. 

The pending action is dispatched immediately, with `type` the same as the original dispatching action with all original `payload` properties apart from the `promise` as the payload object (those are useful for optimistic updates). The resolve action is dispatched only if the promise is resolved, e.g., if it was successful; and the rejected action is dispatched only if the promise is rejected, e.g., if an error occurred.

Both fullfilled actions (resolved and rejected) will be dispatched with the result of the promise as the payload object and all other remaining properties will be dispatched inside the `meta` property. More specifically, in the case of a rejected promise, an `error` is returned in the payload property. Also those fullfiled actions will have the original `type` added by a suffix (default is `_RESOLVED` for resolved and `_REJECTED` for rejected).

Example:

The below action creator, when triggered `dispatch(loadUser('alanrubin'))`

```js
export function loadUser(username) {
  return {
    type: 'LOAD_USER',
    payload: {
      promise: loadUserServiceAndReturnPromise(username)
      username
    }
  };
}
```

will dispatch immediatelly
```js
{
	type: 'LOAD_USER',
	payload: {
		username: 'alanrubin'
	} 
}
```

Assuming promise resolves with `{ id: '1', name: 'Alan Rubin' }`, then it will dispatch
```js
{
	type: 'LOAD_USER_RESOLVED',
	payload: { id: '1', name: 'Alan Rubin' },
	meta: {
		username: 'alanrubin'
	}
}
```

Assuming promise rejects with `Error` object, then it will dispatch
```js
{
	type: 'LOAD_USER_REJECTED',
	payload: Error,
	meta: {
		username: 'alanrubin'
	}
}
```

The middleware also returns the original promise, so you can listen to it and act accordingly from your component if needed (for example redirecting to a new route).

The middleware doesn't include the original promise in the 3 processed actions as it is not useful in the reducers - it is a bad practice to store promises in the state as the state should be serializable.

### Usage in reducers

Another nice feature is that `resolve` and `reject` functions can be imported from the package in order to provide nice semantic switch conditions when writing reducers for those actions. Assuming the example above, in your reducer:

```js
import { resolve, reject } from 'redux-simple-promise';

function users(state = {}, action) {
  switch (action.type) {
  case LOAD_USER:
    return Object.assign({}, state, {
      action.payload.username: { isLoading: true }
    });
  case resolve(LOAD_USER):
    return Object.assign({}, state, {
      action.payload.meta.username: action.payload
    });
  case reject(LOAD_USER):
  	return Object.assign({}, state, {
      action.payload.meta.username: { error: action.payload }
    });
  default:
    return state;
  }
}

```

## Configuration

You can configure the string being added to the action type when resolved or rejected by declaring it when initialiazing the middleware, so considering the example above, if you do

```js
import promiseMiddleware from 'redux-simple-promise';

composeStoreWithMiddleware = applyMiddleware(
  promiseMiddleware('_MY_RESOLVED', '_MY_REJECTED')
)(createStore);

```

then resolved/rejected promised will trigger actions as `'LOAD_USER_MY_RESOLVED'` and `'LOAD_USER_MY_REJECTED'` instead of the default ones `'LOAD_USER_RESOLVED'` and `'LOAD_USER_REJECTED'`.

## Inspiration

I have tried to mix the best behaviour from both [redux-promise](https://github.com/acdlite/redux-promise) and [redux-promise-middleware](https://github.com/pburtchaell/redux-promise-middleware) projects, avoiding as much as possible additional boilerplate declarations (such as declaring 3 times the action type or passing the arguments of the first dispatch in data or meta) and the most consistent behavior (at least in my opinion...).

Thanks to both projects for inspiration, specially to [redux-promise](https://github.com/acdlite/redux-promise) for the project setup and test inspiration.

---
Licensed MIT. Copyright 2015 Alan Rubin.