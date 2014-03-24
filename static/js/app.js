/**
 * Created by ozlevka on 3/23/14.
 */

var Observable = function(object) {
    $observable = object || {};

    $observable._listeners = {};
    $observable.on = function(eventName,callback) {
        if(!this._listeners[eventName]) {
            this._listeners[eventName] = [];
        }

        this._listeners[eventName].push(callback);
    };

    $observable.dispatchEvent = function(eventName, params) {
        if(this._listeners[eventName]){
            jQuery(this._listeners[eventName]).each(function(index, callback){
                callback(params);
            });
        }
    };
    return $observable;
}

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
    .service('Navigate', PantaxObservable)
    .factory('ProperSvc', function(){

    });


var controllers = {
    menuController : function($scope, Navigate) {
        $scope.hello = function() {
            Navigate.dispatchEvent('helloClick');
        };
    },

    navigateController : function($scope,Navigate) {
        Navigate.on('helloClick', function(){
            alert('Hello click');
        })
    }
};

pantaxApp.controller(controllers);





