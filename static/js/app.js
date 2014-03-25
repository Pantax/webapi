/**
 * Created by ozlevka on 3/23/14.
 */
var PantaxObservable = function() {
    this._listeners = {};
}
angular.extend(PantaxObservable.prototype, {
    on : function(eventName, callback) {
        if(!this._listeners[eventName]) {
            this._listeners[eventName] = [];
        }
        this._listeners[eventName].push(callback);
    },

    dispatchEvent : function(eventName, params) {
        if(this._listeners[eventName]) {
            jQuery(this._listeners[eventName]).each(function(index, callback){
                callback(params);
            });
        }
    }

});

var pantaxApp = angular.module('pantaxApp',['ngRoute', 'ngCookies']);
pantaxApp.service("EventObserver", PantaxObservable);
pantaxApp.config(['$routeProvider', function($routeProvider){
    $routeProvider.when('/doctor',{
        templateUrl:'/templates/doctor_menu.html',
        controller : 'MenuCntl'
    })
    $routeProvider.otherwise({redirectTo:'/'});
}]);

var controllers = {
    MenuCntl : function($scope) {

    }
};
pantaxApp.controller(controllers);





