/**
 * Created by ozlevka on 3/23/14.
 */
var currentApiServer = 'http://localhost:8081'

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
pantaxApp.factory('CategorySvc', [function($http){
    var Category = function(){
        this.categories;
    };

    angular.extend(Category.prototype, {
        getCategories : function(callback) {
            jQuery.get(currentApiServer + '/getAllCategories', function(results){
                callback(null,results);
            }).fail(function(err){
                    callback(err);
                });
        },

        saveCategory : function(category, callback) {
            jQuery.ajax({
                type : 'POST',
                url : currentApiServer + '/saveCategory',
                data : angular.toJson(category),
                headers : {
                    "Content-type" : "application/json"
                },
                success : function(result) {
                    callback(null,result);
                },
                error : function(err) {
                    callback(err);
                }
            });
        }
    });

    var categorySvcInstance = new Category();

    return {
        getCategories : categorySvcInstance.getCategories,
        saveCategory : categorySvcInstance.saveCategory
    }
}]);


var controllers = {
    NavCntl : function($scope, EventObserver) {
        $scope.doctorOn = function() {
            EventObserver.dispatchEvent("doctorSwitch");
            EventObserver.dispatchEvent('navChange');
        };

        $scope.patientOn = function() {
            EventObserver.dispatchEvent('patientSwitch');
            EventObserver.dispatchEvent('navChange');
        };
    },

    MenuCntl : function($scope, EventObserver) {
        EventObserver.on('doctorSwitch', function(){
            $scope.template = '/templates/doctor_menu.html'
        });

        EventObserver.on('patientSwitch', function(){
            $scope.template = '/templates/patient_menu.html';
        });

        $scope.categoryOn = function() {
            EventObserver.dispatchEvent('categorySwitch');
        }
    },

    MainCntl : function($scope, EventObserver, CategorySvc) {
        $scope.currentCategory = {};

        EventObserver.on('categorySwitch', function(){
            EventObserver.dispatchEvent("showWaitImage",{});
            $scope.template = '/templates/category_form.html';
            CategorySvc.getCategories(function(err, results){
                setTimeout(function(){
                    EventObserver.dispatchEvent('hideWaitImage',{});
                },5000);
                $scope.categories = angular.fromJson(results);
            });

        });

        EventObserver.on('navChange', function(){
            $scope.template = '';
        })

        $scope.doSaveCategory = function() {
            EventObserver.dispatchEvent("showWaitImage",{});
            var the_category = {category_name : $scope.currentCategory.name};
            CategorySvc.saveCategory(the_category, function(err, results){
                setTimeout(function(){
                    EventObserver.dispatchEvent('hideWaitImage',{});
                },5000);
                $scope.categories.push(the_category);
            });
        }
    },

    WaitCntl : function($scope, EventObserver) {
       $scope.showWaitImage = false;

       EventObserver.on('showWaitImage', function(){
           $scope.showWaitImage = true;
       })

       EventObserver.on('hideWaitImage', function(){
           $scope.showWaitImage = false;
       });
    }
};
pantaxApp.controller(controllers);





