angular.module('app', ['ionic', 'ionic-material', 'app.controllers', 'app.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
     
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
        StatusBar.styleLightContent();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
    .state('auction', {
        url: '/auction',
        templateUrl: 'templates/auction.html',
        controller: 'AuctionCtrl'
    })

    $urlRouterProvider.otherwise('/auction');

})


.constant('WEB_API_URL', 'http://test.triotech.co.nz/flowers/')

.filter('no_false', function() {
    return function(text, length, end) {
        if (text) {
            return text;
        }
        return '';
    }
})

.filter('false_zero', function() {
    return function(text, length, end) {
        if (text) {
            return text;
        }
        return 0;
    }
});