define(['text!templates/page.html', 'views/note'],

    function(template, NoteView) {

        var PageView = Backbone.View.extend({

            initialize  : function(nv) {
                if ($.isArray(nv)) {
                    this.noteRecto = nv[0];
                    this.noteVerso = nv[1];
                } else {
                    this.noteRecto = nv;
                }
            },

            render      : function() {
                // TODO - add noteVerso
                this.$rectoEl = $('<div></div>').addClass('side recto')/*.attr('id', this.noteRecto.model.get('key'))*/;
                this.noteRecto.$el = this.$rectoEl;
                this.noteRecto.render();
                this.$el.append(this.$rectoEl);
            },

            getEl   : function() {
                return this.$rectoEl;
            },

            getNote : function() {
                return this.noteRecto;
            },

            sideCss  : function(name, value, rectoVerso) {
                var filter = rectoVerso ? (rectoVerso == 'recto' ? '.recto' : '.verso') : undefined;
                this.$el.children(filter).css(name, value);
            },

            css     : function(name, value) {
                this.$el.css(name, value);
            }

        });

        return PageView;
    }
);