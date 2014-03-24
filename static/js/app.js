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

var pantaxApp = angular.module('pantaxApp',[])
    .service('Observer', PantaxObservable)
    .config(['$routeProvider', function($routeProvider){
        $routeProvider
            .when('/doctors',{})
            .when('/patients', {})
            .when('/users', {});

    }]);


var controllers = {
    menuController : function($scope, Observer) {

    },

    navigateController : function($scope,Observer) {

    }
};

pantaxApp.controller(controllers);





