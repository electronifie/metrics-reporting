var debug = require('debug')('metrics-reporting');
var servicebus = require('servicebus');
var path = require('path');
var util = require('util');

function loadBus (url, prefetch, queuesFile) {
  var servicebus = require('servicebus');
  bus = servicebus.bus({
    url: url,
    prefetch: prefetch,
    queuesFile: queuesFile
  });
  bus.use(bus.messageDomain());
  bus.use(bus.package());
  bus.use(bus.correlate());
  return bus;
}

function loadBusFromCconfig(pth) {
  var config = require('cconfig')(pth);
  if (config.RABBITMQ_URL === undefined) throw new Error('RABBITMQ_URL not defined');
  return loadBus(config.RABBITMQ_URL, config.SERVICEBUS_PREFETCH, config.SERVICEBUS_QUEUES_FILE);
}

function loadBusFromMeteorConfig (config) {
  return loadBus(config.amqp.url, config.amqp.prefetch, config.amqp.queuesFile);
}

function MetricsClient () {
  var pth;

  try {
    pth = path.join(process.env.PWD, 'lib', 'bus');
    this.bus = require(pth);
    return this;
  } catch (err) {
    debug('unable to load bus from %s. trying config.json', pth);
  }

  try {
    this.bus = loadBusFromCconfig();
    return this;
  } catch (err) {
    debug('unable to load bus via config.json. trying cconfig with supplied path');
  }

  try {
    pth = path.join(process.env.PWD, 'config.json');
    this.bus = loadBusFromCconfig(pth);
    return this;
  } catch (err) {
    debug('unable to load bus via config.json @ [pwd]/config.json. trying meteor config');
  }

  try {
    var meteorSettings = JSON.parse(process.env.METEOR_SETTINGS);
    this.bus = loadBusFromMeteorConfig(meteorSettings);
    return this;
  } catch (err) {
    debug('unable to load bus via meteor config');
    throw new Error('unable to load bus from expected locations and configs');
  }

}

MetricsClient.prototype.decrementCounter = function (series, value, cb) {
  bus.publish('metric.recorded', {
    name: series,
    data: value,
    datetime: Date.now(),
    decrement: true
  }, {
    correlationId: bus.correlationId()
  });
};

MetricsClient.prototype.incrementCounter = function (series, value, cb) {
  bus.publish('metric.recorded', {
    name: series,
    data: value,
    datetime: Date.now(),
    increment: true
  }, {
    correlationId: bus.correlationId()
  });
};

MetricsClient.prototype.writeGauge = function (series, point, cb) {
  bus.publish('metric.recorded', {
    name: series,
    data: point,
    datetime: Date.now()
  }, {
    correlationId: bus.correlationId()
  });
};

MetricsClient.prototype.writeMultiTimer = function (timer, series, point, cb) {
  timer.finish(series, point);
  bus.publish('metric.recorded', {
    name: series,
    data: point,
    datetime: Date.now()
  }, {
    correlationId: bus.correlationId()
  });
};

MetricsClient.prototype.writeTimer = function (timer, cb) {
  timer.finish();
  bus.publish('metric.recorded', {
    name: timer.series,
    data: timer.point,
    datetime: Date.now()
  }, {
    correlationId: bus.correlationId()
  });
};

MetricsClient.prototype.writePoint = function (series, point, cb) {
  bus.publish('metric.recorded', {
    name: series,
    data: point,
    datetime: Date.now()
  }, {
    correlationId: bus.correlationId()
  });
};

MetricsClient.prototype.writePoints = function (series, point, cb) {
  bus.publish('metric.recorded', {
    name: series,
    data: point,
    datetime: Date.now()
  }, {
    correlationId: bus.correlationId()
  });
};

module.exports = new MetricsClient();