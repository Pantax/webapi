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
                    pageInstance.categoryInit();
                });
            });
        },

        categoryInit : function() {
            $('#mainDataContainer').empty().load('templates/category_form.html', function(){
                wait(true);
                runGetAjaxQuery(pageInstance.options.apiurl + '/getAllCategories', function(err, result){
                    wait(false);
                    if(err) {}
                    else {
                        var res = result;
                    }
                });
            });
        }
    });

    function runGetAjaxQuery(url, callback) {
        $.ajax({
            url : url,
            method : 'GET',
            success : function(result) {
                callback(null, result);
            },
            error : function(err) {
                callback(err);
            }
        })
    };

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