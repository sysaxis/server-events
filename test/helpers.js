"use strict";

class Timer {
    constructor() {
        this.restart();
    }

    restart() {
        this._startTime = process.hrtime();
    }

    elapsed(precision) {
        var diff = process.hrtime(this._startTime);
        var ms = diff[0] * 1e3 + diff[1] / 1e6;

        return +ms.toFixed(precision);
    }

    lap(precision) {
        var time = this.elapsed(precision);

        this.restart();

        return time;
    }
}

module.exports = {
    Timer
}
