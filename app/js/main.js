requirejs.config({
    baseUrl: 'js',

    paths: {
        text: 'libs/text'
    },

    // Sets the configuration for third party scripts that are not AMD compatible
    shim: {
        'libs/showdown': {
            exports: 'Showdown'
        },
        'libs/underscore': {
            exports: '_'
        },
        'libs/backbone': {
            deps: ['libs/underscore'],
            exports: 'Backbone'
        },
        'app': {
            deps: ['libs/underscore', 'libs/backbone', 'libs/showdown']
        }
    }
});

require(['app'],

    function(App) {
        window.heft = new App();
    }
);
