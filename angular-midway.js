(function (window, angular, undefined) {
  
  'use strict';
  
  angular.mock.I = {};
  
  // This is a trick, referred by tear down method, cp from angular mock
  function MockXhr() {
    
    // hack for testing $http, $httpBackend
    MockXhr.$$lastInstance = this;
    
    this.open = function(method, url, async) {
      this.$$method = method;
      this.$$url = url;
      this.$$async = async;
      this.$$reqHeaders = {};
      this.$$respHeaders = {};
    };
    
    this.send = function(data) {
      this.$$data = data;
    };
    
    this.setRequestHeader = function(key, value) {
      this.$$reqHeaders[key] = value;
    };
    
    this.getResponseHeader = function(name) {
      // the lookup must be case insensitive,
      // that's why we try two quick lookups first and full scan last
      var header = this.$$respHeaders[name];
      if (header) return header;
      
      name = angular.lowercase(name);
      header = this.$$respHeaders[name];
      if (header) return header;
      
      header = undefined;
      angular.forEach(this.$$respHeaders, function(headerVal, headerName) {
        if (!header && angular.lowercase(headerName) == name) header = headerVal;
      });
      return header;
    };
    
    this.getAllResponseHeaders = function() {
      var lines = [];
      
      angular.forEach(this.$$respHeaders, function(value, key) {
        lines.push(key + ': ' + value);
      });
      return lines.join('\n');
    };
    
    this.abort = angular.noop;
  }
  
  if (window.Cucumber) {
    
    var currentSpec = null,
        annotatedFunctions = [],
        isSpecRunning = function() {
          return !!currentSpec;
        };
    
    angular.mock.$$annotate = angular.injector.$$annotate;
    angular.injector.$$annotate = function(fn) {
      if (typeof fn === 'function' && !fn.$inject) {
        annotatedFunctions.push(fn);
      }
      return angular.mock.$$annotate.apply(this, arguments);
    };
    
    window.Cucumber.callback = function (scenario) {
      
      (scenario.Before)(function () {
        annotatedFunctions = [];
        currentSpec = this;
      });
      
      (scenario.After)(function() {

        annotatedFunctions.forEach(function(fn) {
          delete fn.$inject;
        });

        if (isSpecRunning()) {  // TODO: resolve the bug of karma-cucumber-js
          var injector = currentSpec.$injector;

          angular.forEach(currentSpec.$modules, function(module) {
            if (module && module.$$hashKey) {
              module.$$hashKey = undefined;
            }
          });

          currentSpec.$injector = null;
          currentSpec.$modules = null;
          currentSpec = null;

          if (injector) {
            injector.get('$rootElement').off();
          }

        }

        // clean up jquery's fragment cache
        angular.forEach(angular.element.fragments, function(val, key) {
          delete angular.element.fragments[key];
        });

        MockXhr.$$lastInstance = null;

        angular.forEach(angular.callbacks, function(val, key) {
          delete angular.callbacks[key];
        });
        angular.callbacks.counter = 0;

      });
      
    };
    
    
    window.module = angular.mock.module = function() {
      var moduleFns = Array.prototype.slice.call(arguments, 0);
      return isSpecRunning() ? workFn() : workFn;
      /////////////////////
      function workFn() {
        if (currentSpec.$injector) {
          throw new Error('Injector already created, can not register a module!');
        } else {
          var modules = currentSpec.$modules || (currentSpec.$modules = []);
          angular.forEach(moduleFns, function(module) {
            if (angular.isObject(module) && !angular.isArray(module)) {
              modules.push(function($provide) {
                angular.forEach(module, function(value, key) {
                  $provide.value(key, value);
                });
              });
            } else {
              modules.push(module);
            }
          });
        }
      }
    };
    
    
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
    
    window.inject = angular.mock.inject = function() {
      var blockFns = Array.prototype.slice.call(arguments, 0);
      var errorForStack = new Error('Declaration Location');
      // IE10+ and PhanthomJS do not set stack trace information, until the error is thrown
      if (!errorForStack.stack) {
        try {
          throw errorForStack;
        } catch (e) {}
      }
      return isSpecRunning() ? workFn.call(currentSpec) : workFn;
      /////////////////////
      function workFn() {
        var modules = currentSpec.$modules || [];
        var strictDi = !!currentSpec.$injectorStrict;
        modules.unshift('ngMock');
        modules.unshift('ng');
        var injector = currentSpec.$injector;
        if (!injector) {
          if (strictDi) {
            // If strictDi is enabled, annotate the providerInjector blocks
            angular.forEach(modules, function(moduleFn) {
              if (typeof moduleFn === "function") {
                angular.injector.$$annotate(moduleFn);
              }
            });
          }
          injector = currentSpec.$injector = angular.injector(modules, strictDi);
          currentSpec.$injectorStrict = strictDi;
        }
        for (var i = 0, ii = blockFns.length; i < ii; i++) {
          if (currentSpec.$injectorStrict) {
            // If the injector is strict / strictDi, and the spec wants to inject using automatic
            // annotation, then annotate the function here.
            injector.annotate(blockFns[i]);
          }
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
      }
    };
    
    angular.mock.inject.strictDi = function(value) {
      value = arguments.length ? !!value : true;
      return isSpecRunning() ? workFn() : workFn;
      
      function workFn() {
        if (value !== currentSpec.$injectorStrict) {
          if (currentSpec.$injector) {
            throw new Error('Injector already created, can not modify strict annotations');
          } else {
            currentSpec.$injectorStrict = value;
          }
        }
      }
    };
    
  }

  // TODO: This is for integration test, inspired by ng-midway-tester and some other integration testing framework
  /**
   * I.goto('/login').from('/home');
   * I.gotoUrl('');
   *
   * @type {angular.mock.I.visit}
   */
  window.I = angular.mock.I.visit = function () {
    
  };


  // // Keep my first version as a souvenir
  // var injector,
  //     modules;
  // window.module = angular.mock.module = function () {
  //   var moduleFns = Array.prototype.slice.call(arguments, 0);
  //   modules = moduleFns;
  //   return modules;
  // };
  //
  // window.inject = angular.mock.inject = function () {
  //   var blockFns = Array.prototype.slice.call(arguments, 0);
  //   var errorForStack = new Error('Declaration Location');
  //
  //   // IE10+ and PhanthomJS do not set stack trace information, until the error is thrown
  //   if (!errorForStack.stack) {
  //     try {
  //       throw errorForStack;
  //     } catch (e) {}
  //   }
  //
  //   modules.unshift('ngMidway');
  //   modules.unshift('ng');
  //
  //   injector = angular.injector(modules);
  //
  //   for (var i = 0, ii = blockFns.length; i < ii; i++) {
  //     try {
  //       /* jshint -W040 *//* Jasmine explicitly provides a `this` object when calling functions */
  //       injector.invoke(blockFns[i] || angular.noop, this);
  //       /* jshint +W040 */
  //     } catch (e) {
  //       if (e.stack && errorForStack) {
  //         throw new ErrorAddingDeclarationLocationStack(e, errorForStack);
  //       }
  //       throw e;
  //     } finally {
  //       errorForStack = null;
  //     }
  //   }
  // };
  
})(window, window.angular);
