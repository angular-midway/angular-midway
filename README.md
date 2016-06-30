# angular-midway

This is an extention of angular-mock based on version 1.4.8, 
which supports CucumberJS. I suggest you to use [karma-cucumber-js](https://www.npmjs.com/package/karma-cucumber-js)
 
> Most of the method were just simply copied from angular-mock,

Please don't hesitate to contact me if you have any concerns.


## Inspired by:

[angular-mocks](https://www.npmjs.com/package/angular-mocks)

[ng-midway-tester](https://www.npmjs.com/package/ng-midway-tester)


## Getting Started

``` Shell
npm install jquery --save-dev
npm install cucumber --save-dev
npm install karma-cucumber-js --save-dev
npm install angular-midway --save-dev
```

For more configuration information please see [karma-cucumber-js](https://www.npmjs.com/package/karma-cucumber-js)


## Step Definitions

Please ensure that you have already setup the environment according to [karma-cucumber-js](https://www.npmjs.com/package/karma-cucumber-js) guidline.
And then in the step definition add additional callback, it's not a good way,
but you have to, I will improve it in the feature.

``` JavaScript
__adapter__.addStepDefinitions(function (scenario) {
    window.Cucumber.callback(scenario); // Don't forget to add this line
    scenario.Given(/^there is a test step$/, function () { });
    scenario.When(/^it is executed$/, function () { });
    scenario.When(/^it is not executed$/, function (callback) { return callback.pending(); });
    scenario.Then(/^test succeeds$/, function () { });
    scenario.Then(/^test fails$/, function (callback) { return callback(new Error('Step failed')); });
});
```


## Issues

Please tell me any issues you have detected or any innovate ideas and submit them [here](https://github.com/angular-midway/angular-midway/issues).

Let's make it better together.


