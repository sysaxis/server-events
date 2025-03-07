
# server-events

An asynchronous cross-server eventing. Uses Redis Pub/Sub messaging system for cross-server communication.

## Example

Say we have N servers servicing an API for an app and a worker server running some heavy loads. All the servers are connected to a Redis cluster.
An action by the app triggers a worker job that produces a result in an unknown time. A result that the app is interested in.
ServerEvents allows an API endpoint to respond with the result just as it becomes available.
Worker can send a response to an endpoint instance on a particular server right after it has finished running a job.
If worker fails to deliver results in time, the event will time out and the API endpoint can respond with a controlled message.

## Usage

### Initialization
Intialize a ServerEvents instance by providing Redis server options. Optionally you can subscribe to listen 'ready' and 'error' events.
```js
const ServerEvents = require('server-events');

const randomEvents = new ServerEvents({
    host: 'localhost',
    port: 6379,
    db: 0
});

// connect to redis server
await randomEvents.init()

randomEvents.onerror(function(store, error) {
    // store can be either 'outputStore' or 'inputStore'
    console.log(store, error);
});
```

### Triggering events
Events are referenced by name and id. The name specifies context while id can be used to reference a certain object (i.e. database table index).
```js
    randomEvents.emit('not so random', 12);
```

Additional arguments passed to the emitter will be passed on to the listener.
```js
    await randomEvents.emit('pi event', 314, 'arg1', 1, {type: 'object'});
```

### Waiting for events
Events returned as promises. Provide a thenable if you wish to get the results as an array.
```js
    randomEvents.on('pi event', 314).then(function(result) {
        // result ~ ['arg1', 1, {type: 'object'}]
    });
```
Or spreadable to receive them naturally.
```js
    randomEvents.on('pi event', 314).then(function([a, b, c]) {
        // a ~ 'arg1', b ~ 1, c ~ {type: 'object'}
    });
```
Event timeout will result in an error.
```js
    randomEvents.on('wont', 'happen').catch(function(error) {
        // event has timed out
    });
```
Custom timeout can be passed.
```js
    randomEvents.on('ev', 101, 5000).catch(function(a) {
        // event will timeout after 5000 ms unless result is returned
    });
```

### Options

The default timeout for all ServerEvents instances is 10000 ms. This can be overriden for each instance:
```js
    randomEvents.timeout = 1000; // 1 second
```

## Test

```js
npm test
```


## Changelog

### 1.2.0

- Upgraded to redis@4