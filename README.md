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

To use the middleware, dispatch a `promise` property and optional properties within the `payload` of the action and specify the action `type` string as you normally do. The entire payload is dispatched from the pending action and is useful for optimistic updates.

The pending action is dispatched immediately. The fulfilled action is dispatched only if the promise is resolved, e.g., if it was successful; and the rejected action is dispatched only if the promise is rejected, e.g., if an error occurred.

Both fullfilled actions (resolved and rejected) will be dispatched with the same format of payload (including the optional properties) but with a `promise` property containing the resolve value of the promise. In the case of a rejected promise, an `error` is returned in the promise property. Also those fullfiled actions will have the original type added by a suffix (default is `_RESOLVED` for resolved and `_REJECTED` for rejected).

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
		promise: thePromiseReturned,
		username: 'alanrubin'
	}
}
```

Assuming promise resolves with `{ id: '1', name: 'Alan Rubin' }`, then it will dispatch
```js
{
	type: 'LOAD_USER_RESOLVED',
	payload: {
		promise: { id: '1', name: 'Alan Rubin' },
		username: 'alanrubin'
	}
}
```

Assuming promise rejects with `Error` object, then it will dispatch
```js
{
	type: 'LOAD_USER_REJECTED',
	payload: {
		promise: Error,
		username: 'alanrubin'
	}
}
```

The middleware also returns the original promise, so you can listen to it and act accordingly from your component if needed (for example redirect to a new route).

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

I have tried to mix the best behaviour from both [redux-promise](https://github.com/acdlite/redux-promise) and [redux-promise-middleware](https://github.com/pburtchaell/redux-promise-middleware) projects, avoiding as much as possible additional boilerplate declarations (such as declaring 3 times the action type or passing the arguments of the first dispatch in data or meta).

Thanks to both projects for inspiration, specially to [redux-promise](https://github.com/acdlite/redux-promise) for the project setup and test inspiration.

---
Licensed MIT. Copyright 2015 Alan Rubin.