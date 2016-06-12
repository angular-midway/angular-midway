# angular-midway

This is a plugin of angular-mock based on version 1.4.8, 
which supports CucumberJS.
 
> Most of the method were just simply copied from angular-mock,

Please hesitate to contact me, if you have any concerns.


## Inspired by:

[angular-mock](https://www.npmjs.com/package/angular-mocks)

[ng-midway-tester](https://www.npmjs.com/package/ng-midway-tester)


## Getting Started

``` Shell
npm install jquery --save-dev
npm install cucumber --save-dev
npm install karma-cucumber-js --save-dev
npm install angular-midway --save-dev
```

For more information please see [karma-cucumber-js](https://www.npmjs.com/package/karma-cucumber-js)


## Step Definitions

Please insure you have already setup the environment follow karma-cucumber-js
instruction.
And then in the step definition add additional callback, it's not a good way,
but you have to, I'm going to improve it in the feature.

``` JavaScript
__adapter__.addStepDefinitions(function (scenario) {
    window.Cucumber.callback(scenario); // Don't forget add this line
    scenario.Given(/^there is a test step$/, function () { });
    scenario.When(/^it is executed$/, function () { });
    scenario.When(/^it is not executed$/, function (callback) { return callback.pending(); });
    scenario.Then(/^test succeeds$/, function () { });
    scenario.Then(/^test fails$/, function (callback) { return callback(new Error('Step failed')); });
});
```



