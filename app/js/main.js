requirejs.config({
    baseUrl: 'js',

    paths: {
        underscore: 'libs/lodash.underscore',
        backbone: 'libs/backbone',
        text: 'libs/text',
        mediator: 'libs/backbone-mediator',
        localstorage: 'libs/backbone.localStorage',
        showdown: 'libs/showdown'
    },

    // Sets the configuration for third party scripts that are not AMD compatible
    shim: {
        showdown: {
            exports: 'Showdown'
        },
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ['underscore'],
            exports: 'Backbone'
        },
        'app': {
            deps: ['underscore', 'backbone', 'mediator', 'showdown']
        }
    }
});

require(['app'],

    function(App) {
        window.heft = new App();
    }
);
