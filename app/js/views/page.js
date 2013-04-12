define(['text!templates/page.html', 'views/note', 'views/transformUtils'],

    function(template, NoteView, transformUtils) {

        var PageView = Backbone.View.extend({

            note        : {},

            initialize  : function(nv) {
                this.note = nv;
                this.$el = $('<div></div>').addClass('page').attr('id', nv.model.cid);
            },

            render      : function() {
                this.note.render();
                this.$el.append(this.note.$el);
                return this;
            },

            getEl   : function() {
                return this.$el;
            },

            getNote : function() {
                return this.note;
            },

            css     : function(name, value) {
                this.$el.css(name, value);
            },

            setMultiPosition    : function(pos) {
                var classes = this.$el.attr('class').split(/\s+/),
                    className = 'multi-'+pos;
                _.each(classes, function(cl) {
                    if (cl == className) {
                        return;
                    } else if (cl.substr(0, 5) == 'multi') {
                        this.$el.removeClass(cl);
                    }
                });
                this.$el.addClass(className);
            }
        });

        _.extend(PageView.prototype, transformUtils);

        return PageView;
    }
);