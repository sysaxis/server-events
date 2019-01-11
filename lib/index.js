"use strict";

const EventEmitter = require('events');
const redis = require('redis');
const Triggers = require('./triggers');

class ServerEvents {

    /**
     * Server event manager
     * @param {Object} options Redis options
     */
    constructor(options) {

        const events = this._events = new EventEmitter();

        const inputStore = this._inputStore = redis.createClient(options);

        inputStore.on('error', function(error) {
            events.emit('error', 'inputstore', error);
        });
        
        const outputStore = this._outputStore = redis.createClient(options);
        
        outputStore.on('error', function(error) {
            events.emit('error', 'outputstore', error);
        });

        function _allReady() {
            if (inputStore.ready && outputStore.ready) {
                events.emit('ready');
            }
        }

        inputStore.on('ready', _allReady);
        outputStore.on('ready', _allReady);

        const eventTriggers = this._eventTriggers = new Triggers();        

        outputStore.on('message', function(channel, message) {
            eventTriggers.set.apply(eventTriggers, JSON.parse(message));
            outputStore.unsubscribe(channel);
        });

    }

    static getEventHandle(event, id) {
        return event + ':' + id;
    }

    /**
     * Register a listener for 'ready' event
     * @param {function} listener event callback function
     */
    onready(listener) {
        if (this._inputStore.ready && this._outputStore.ready) {
            return listener();
        }
        return this._events.on('ready', listener);
    }

    /**
     * Register a listener for 'error' event
     * @param {function} listener event callback function
     */
    onerror(listener) {
        return this._events.on('error', listener);
    }
    
    /**
     * Returns the default event timeout in ms.
     */
    get timeout() {
        return this._eventTriggers.defaultTimeout;
    }

    /**
     * Overrides the default event timeout
     * @param {Number} duration timeout in ms
     */
    set timeout(duration) {
        return this._eventTriggers.defaultTimeout = duration;
    }

    /**
     * Emits an event with given eventName and eventId
     * @param {*} eventName Name of the event
     * @param {*} eventId Id of the event (used to indicate a specific object in the event)
     */
    emit(eventName, eventId) {
        var eventHandle = ServerEvents.getEventHandle(eventName, eventId);

        var args = arguments;
        var argArray = Object.keys(args).map(k => args[k]);

        this._inputStore.publish(eventHandle, JSON.stringify(argArray));
    }

    /**
     * Returns a promise that resolves whenever event is emitted.
     * @param {*} eventName 
     * @param {*} id 
     * @param {*} timeout 
     * @returns emitted arguments
     */
    on(eventName, eventId, timeout) {
        var eventHandle = ServerEvents.getEventHandle(eventName, eventId);

        this._outputStore.subscribe(eventHandle);

        return this._eventTriggers.wait(eventName, eventId, timeout);
    }
}

module.exports = ServerEvents;
