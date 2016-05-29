// TODO: clean code & make it more simple according to our requirements
// TODO: find a batter a solution which allow us use angular-mock lib, because this is similar with angular mock, there is no need for us to maintenance two libs
(function (window, angular) {
  'use strict';
  
  var injector;

  angular.mock = {};
  angular.mock.I = {};

  angular.mock.$ExceptionHandlerProvider = function() {
    var handler;

    this.mode = function(mode) {

      switch (mode) {
        case 'log':
        case 'rethrow':
          var errors = [];
          handler = function(e) {
            if (arguments.length == 1) {
              errors.push(e);
            } else {
              errors.push([].slice.call(arguments, 0));
            }
            if (mode === "rethrow") {
              throw e;
            }
          };
          handler.errors = errors;
          break;
        default:
          throw new Error("Unknown mode '" + mode + "', only 'log'/'rethrow' modes are allowed!");
      }
    };

    this.$get = function() {
      return handler;
    };

    this.mode('rethrow');
  };

  angular.mock.$LogProvider = function() {
    var debug = true;

    function concat(array1, array2, index) {
      return array1.concat(Array.prototype.slice.call(array2, index));
    }

    this.debugEnabled = function(flag) {
      if (angular.isDefined(flag)) {
        debug = flag;
        return this;
      } else {
        return debug;
      }
    };

    this.$get = function() {
      var $log = {
        log: function() { $log.log.logs.push(concat([], arguments, 0)); },
        warn: function() { $log.warn.logs.push(concat([], arguments, 0)); },
        info: function() { $log.info.logs.push(concat([], arguments, 0)); },
        error: function() { $log.error.logs.push(concat([], arguments, 0)); },
        debug: function() {
          if (debug) {
            $log.debug.logs.push(concat([], arguments, 0));
          }
        }
      };

      /**
       * @ngdoc method
       * @name $log#reset
       *
       * @description
       * Reset all of the logging arrays to empty.
       */
      $log.reset = function() {
        /**
         * @ngdoc property
         * @name $log#log.logs
         *
         * @description
         * Array of messages logged using {@link ng.$log#log `log()`}.
         *
         * @example
         * ```js
         * $log.log('Some Log');
         * var first = $log.log.logs.unshift();
         * ```
         */
        $log.log.logs = [];
        /**
         * @ngdoc property
         * @name $log#info.logs
         *
         * @description
         * Array of messages logged using {@link ng.$log#info `info()`}.
         *
         * @example
         * ```js
         * $log.info('Some Info');
         * var first = $log.info.logs.unshift();
         * ```
         */
        $log.info.logs = [];
        /**
         * @ngdoc property
         * @name $log#warn.logs
         *
         * @description
         * Array of messages logged using {@link ng.$log#warn `warn()`}.
         *
         * @example
         * ```js
         * $log.warn('Some Warning');
         * var first = $log.warn.logs.unshift();
         * ```
         */
        $log.warn.logs = [];
        /**
         * @ngdoc property
         * @name $log#error.logs
         *
         * @description
         * Array of messages logged using {@link ng.$log#error `error()`}.
         *
         * @example
         * ```js
         * $log.error('Some Error');
         * var first = $log.error.logs.unshift();
         * ```
         */
        $log.error.logs = [];
        /**
         * @ngdoc property
         * @name $log#debug.logs
         *
         * @description
         * Array of messages logged using {@link ng.$log#debug `debug()`}.
         *
         * @example
         * ```js
         * $log.debug('Some Error');
         * var first = $log.debug.logs.unshift();
         * ```
         */
        $log.debug.logs = [];
      };

      /**
       * @ngdoc method
       * @name $log#assertEmpty
       *
       * @description
       * Assert that all of the logging methods have no logged messages. If any messages are present,
       * an exception is thrown.
       */
      $log.assertEmpty = function() {
        var errors = [];
        angular.forEach(['error', 'warn', 'info', 'log', 'debug'], function(logLevel) {
          angular.forEach($log[logLevel].logs, function(log) {
            angular.forEach(log, function(logItem) {
              errors.push('MOCK $log (' + logLevel + '): ' + String(logItem) + '\n' +
                  (logItem.stack || ''));
            });
          });
        });
        if (errors.length) {
          errors.unshift("Expected $log to be empty! Either a message was logged unexpectedly, or " +
              "an expected log message was not checked and removed:");
          errors.push('');
          throw new Error(errors.join('\n---------\n'));
        }
      };

      $log.reset();
      return $log;
    };
  };

  angular.mock.dump = function(object) {
    return serialize(object);

    function serialize(object) {
      var out;

      if (angular.isElement(object)) {
        object = angular.element(object);
        out = angular.element('<div></div>');
        angular.forEach(object, function(element) {
          out.append(angular.element(element).clone());
        });
        out = out.html();
      } else if (angular.isArray(object)) {
        out = [];
        angular.forEach(object, function(o) {
          out.push(serialize(o));
        });
        out = '[ ' + out.join(', ') + ' ]';
      } else if (angular.isObject(object)) {
        if (angular.isFunction(object.$eval) && angular.isFunction(object.$apply)) {
          out = serializeScope(object);
        } else if (object instanceof Error) {
          out = object.stack || ('' + object.name + ': ' + object.message);
        } else {
          // TODO(i): this prevents methods being logged,
          // we should have a better way to serialize objects
          out = angular.toJson(object, true);
        }
      } else {
        out = String(object);
      }

      return out;
    }

    function serializeScope(scope, offset) {
      offset = offset ||  '  ';
      var log = [offset + 'Scope(' + scope.$id + '): {'];
      for (var key in scope) {
        if (Object.prototype.hasOwnProperty.call(scope, key) && !key.match(/^(\$|this)/)) {
          log.push('  ' + key + ': ' + angular.toJson(scope[key]));
        }
      }
      var child = scope.$$childHead;
      while (child) {
        log.push(serializeScope(child, offset + '  '));
        child = child.$$nextSibling;
      }
      log.push('}');
      return log.join('\n' + offset);
    }
  };

  angular.mock.$RootElementProvider = function() {
    this.$get = function() {
      return angular.element('<div ng-app></div>');
    };
  };

  angular.module('ngMidway', ['ng']);

  var ErrorAddingDeclarationLocationStack = function(e, errorForStack) {
    this.message = e.message;
    this.name = e.name;
    if (e.line) this.line = e.line;
    if (e.sourceId) this.sourceId = e.sourceId;
    if (e.stack && errorForStack)
      this.stack = e.stack + '\n' + errorForStack.stack;
    if (e.stackArray) this.stackArray = e.stackArray;
  };
  ErrorAddingDeclarationLocationStack.prototype.toString = Error.prototype.toString;


  window.module = angular.mock.module = function () {
    var moduleFns = Array.prototype.slice.call(arguments, 0);

    injector = angular.injector(moduleFns);
    
    return injector;
  };

  window.inject = angular.mock.inject = function () {
    var blockFns = Array.prototype.slice.call(arguments, 0);
    var errorForStack = new Error('Declaration Location');

    // IE10+ and PhanthomJS do not set stack trace information, until the error is thrown
    if (!errorForStack.stack) {
      try {
        throw errorForStack;
      } catch (e) {}
    }

    for (var i = 0, ii = blockFns.length; i < ii; i++) {
      try {
        /* jshint -W040 *//* Jasmine explicitly provides a `this` object when calling functions */
        injector.invoke(blockFns[i] || angular.noop, this);
        /* jshint +W040 */
      } catch (e) {
        if (e.stack && errorForStack) {
          throw new ErrorAddingDeclarationLocationStack(e, errorForStack);
        }
        throw e;
      } finally {
        errorForStack = null;
      }
    }
  };
  
  // TODO: as this is for integration test, so we should implement this function
  window.I = angular.mock.I.visit = function () {
    
  };





})(window, window.angular);