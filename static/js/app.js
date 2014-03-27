(function($){
    var Page = function(options) {
        this.options = options || {};
    }

    $.extend(Page.prototype, {
        init : function() {
            $('#btnDoctors').click(function(){
                $('#sideMenuContainer').empty().load('/templates/doctor_menu.html', function(){
                    $('#btnCategory').click(pageInstance.categoryInit);
                });
            });


            $('#btnPatients').click(function(){
                $('#sideMenuContainer').empty().load('templates/patient_menu.html', function(){

                });
            });
        },

        categoryInit : function() {
            $('#mainDataContainer').empty().load('templates/category_form.html', function(){
                wait(true);
                runGetAjaxQuery(pageInstance.options.apiurl + '/getAllCategories', function(err, result){
                    if(err) {
                        wait(false);
                    }
                    else {
                        var results = $.parseJSON(result);
                        async.each(results, function(category,callback){
                            $('#cntCategories').append('<li>' + category.category_name + '</li>');
                            callback(null);
                        }, function(err){
                            wait(false);
                        });
                    }
                });

                $('#frmCategory').submit(function()
                {
                    //todo check category name  to not empty
                    wait(true);
                    var category = {
                        category_name : $('#txtCategoryName').val()
                    };

                    runPostAjaxQuery(pageInstance.options.apiurl + '/saveCategory', category, function(err, result){
                        if(err) {}
                        else {
                            //todo check results
                            $('#cntCategories').append('<li>' + category.category_name + '</li>');
                            wait(false);
                        }
                    });
                    return false;
                });
            });
        }
    });

    function runGetAjaxQuery(url, callback) {
        $.ajax({
            url : url,
            method : 'GET',
            success : function(result, status) {
                callback(null, result);
            },
            error : function(err) {
                callback(err);
            }
        });
    };

    function runPostAjaxQuery(url, data, callback) {
        $.ajax({
            url : url,
            method : 'POST',
            data : data,
            success : function(result, status) {
                callback(null, result);
            },
            error : function(err) {
                callback(err);
            }
        });
    }

    function wait(show) {
        if(show)
            $('#imgWait').show();
        else
            $('#imgWait').hide();
    }

    var pageInstance = null;


    $.extend($, {
        initPage : function(options) {
            if (!pageInstance) {
                pageInstance = new Page(options);
                pageInstance.init();
            }
        }
    });

}) (jQuery);



$(document).ready(function(){
    $.get('/config/config.json', function(result){
        $.initPage(result);
    })
})