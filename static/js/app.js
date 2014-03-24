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
pantaxApp.service('Observer', PantaxObservable);
pantaxApp.factory('LoginSvc', function($cookies){
    var badrequest = $cookies.badrequest;

    return {
        isBadLogin : function() {
            if(badrequest && badrequest == 'true') return true;
            return false;
        }
    }
});
var controllers = {
    LoginController : function($scope, LoginSvc) {
        $scope.isBadLogin = function() {
            return LoginSvc.isBadLogin();
        }
    },
    SearchController : function($scope,$http) {
        $scope.search = function() {
            alert($scope.searchTerm);
        };
    }
};
pantaxApp.controller(controllers);





