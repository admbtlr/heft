define([], function() {

    var transformUtils = {

        scale: 1,

        setScale: function(scale, callback) {
            this.scale = scale;
            this.setTransform('scale('+scale+')', callback);
        },

        setOpacity: function(opacity) {
            this.$el.css('opacity', opacity);
        },

        getTransition   : function() {
            return this.$el.css('-webkit-transition');
        },

        setTransition   : function(transition) {
            return this.$el.css('-webkit-transition', transition);
        },

        clearTransition  : function() {
            this.setTransition('');
        },

        getTransform    : function() {
            return this.$el.css('-webkit-transform');
        },

        // either callback is a post-transition callback function
        // or it's nothing
        // or it's a boolean false, meaning do transform without transition
        setTransform    : function(transform, callback, context, args) {
            var transition;
            if (callback === false) {
                transition = this.getTransition();
                this.setTransition('');
            } else {
                this.doPostTransitionCallback(callback, context, args);
            }
            this.$el.css('-webkit-transform', transform);
            if (transition) {
                this.setTransition(transition);
            }
        },

        clearTransform  : function(callback, context, args) {
            this.setTransform('', callback, context, args);
        },

        addClass        : function(klass, callback, context, args) {
            this.doPostTransitionCallback(callback, context, args);
            this.$el.addClass(klass);
        },

        removeClass        : function(klass, callback, context, args) {
            this.doPostTransitionCallback(callback, context, args);
            this.$el.removeClass(klass);
        },

        toggleClass        : function(klass, callback, context, args) {
            this.doPostTransitionCallback(callback, context, args);
            this.$el.toggleClass(klass);
        },

        doPostTransitionCallback    : function(callback, context, args) {
            var that = this;
            if (callback) {
                this.$el.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
                    that.$el.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
                    callback.call(context, args);
                });
            }
        }
    };

    return transformUtils;
});
