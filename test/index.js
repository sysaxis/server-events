
const Promise = require('bluebird');
const {assert, expect} = require('chai');

const {Timer} = require('./helpers');

const ServerEvents = require('../lib');

const config = {
    host: 'localhost',
    port: 6379,
    db: 0
};

const events1 = new ServerEvents(config);
const events2 = new ServerEvents(config);

describe('ServerEvents/Eventing', function() {

    this.timeout(15000);

    before(function() {

        return Promise.all([
            Promise.fromCallback(cb => events1.onready(cb)),
            Promise.fromCallback(cb => events2.onready(cb))
        ]);
    });

    it('should emit event E1 results', function(done) {
        events1.on('E', 1).spread(function(a, b, c) {
            expect(a).to.eq('arg 1');
            assert.deepEqual(b, {
                f: 1,
                c: { k: 'a' }
            });
            assert.strictEqual(c, undefined);

            done();
        }).catch(function(error) {
            done(error);
        });

        events1.emit('E', 1, 'arg 1', {
            f: 1,
            c: { k: 'a' }
        });
    });

    it('should timeout in custom timeout', function(done) {
        events1.on('timeout event', 1, 2000).then(function() {
            done('event was triggered before timeout');
        }).catch(function() {
            done();
        });
    
        setTimeout(function() {
            events1.emit('timeout event', 1);
        }, 2500);        
    });

    it('should timeout in default timeout', function(done) {

        events2.timeout = 4000;
        var timer = new Timer();
        events2.on('B', 1).spread(function() {
            done('event was triggered before default timeout');
        }).catch(function() {

            expect(timer.elapsed()).to.be.greaterThan(3900).and.lessThan(4100);
            done();
        });
    });

    it('should return a simple object with thenable', function(done) {

        events2.on('F', 150).then(function(result, excessive) {
            assert.deepEqual(result, ['value1', 'value2']);
            assert.strictEqual(excessive, undefined);

            done();
        }).catch(function(error) {

            done(error);
        });

        events2.emit('F', 150, 'value1', 'value2');
    });

    after(function() {
        events1.close();
        events2.close();
    });
});
