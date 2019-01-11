"use strict";

const EventEmitter = require('events');
const Promise = require('bluebird');

const DEFAULT_TIMEOUT = 10 * 1000; // 10 seconds

class Triggers extends EventEmitter {

    /**
     * Event emitter that provides waiting and setting of events.
     */
	constructor() {
		super();

		this._timeout = DEFAULT_TIMEOUT;
	}
	
	/**
	 * Returns the default timeout of events.
	 */
	get defaultTimeout() {
		return this._timeout;
	}

	/**
	 * Overrides the default timeout of events.
	 * @param {Number} duration timeout in ms
	 */
	set defaultTimeout(duration) {
		if (!isNaN(duration) && +duration > 0) {
			this._timeout = +duration;
			return true;
		}

		return false;
	}

    /**
     * Waits for a trigget with given name and id.
     * @param {String} name trigger name
     * @param {String|Number} id trigger id
     * @param {Number} [timeout=10000] maximum amount of time to wait [ms]
     */
	wait(name, id, timeout) {
        var _triggerId = name + ':' + id;
        var This = this;
		return new Promise((resolve, reject) => {
			var _done = false;
			var _timeout;
			This.once(_triggerId, function(error) {
				if (_done) {
					// timeout was exceeded
					reject(new Error("Timeout exceeded!"))
					return;
				}
				else {
					clearTimeout(_timeout);
				}

				if (error instanceof Error) {
					reject(error);
				} else {
                    var results = Triggers.getResults(arguments);
					resolve.call(this, results);
				}
			});
			_timeout = setTimeout(function() {
				_done = true;

				This.emit(_triggerId);
			}, timeout || This._timeout);
		});
    }
    
    /**
     * Set's off a trigger with given name and id.
     * Further parameters will be passed to the waiter as arguments.
     * @param {*} name trigger name
     * @param {*} id trigger id
     */
	set(name, id) {
		var _triggerId = name + ':' + id;
		var _args = Triggers.getEmitArgs(_triggerId, arguments);
		this.emit.apply(this, _args);
	}

	static getEmitArgs(id, args) {
		var _args = Object.keys(args).slice(2).map(k => args[k]);
        _args.unshift(id);
        return _args;
    }
    
    static getResults(args) {
        return Object.keys(args).map(k => args[k]);
    }
}

module.exports = Triggers;
