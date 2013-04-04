define(['text!templates/page.html', 'views/note'],

    function(template, NoteView) {

        var PageView = Backbone.View.extend({

            note        : {},

            initialize  : function(nv) {
                this.note = nv;
            },

            render      : function() {
                // TODO - add noteVerso
                // this.$rectoEl = $('<div></div>').addClass('side recto').attr('id', this.noteRecto.model.get('key'));
                // this.noteRecto.$el = this.$rectoEl;
                this.note.render();
                this.$el.append(this.note.$el);
            },

            getEl   : function() {
                return this.$el;
            },

            getNote : function() {
                return this.note;
            },

            // sideCss  : function(name, value, rectoVerso) {
            //     var filter = rectoVerso ? (rectoVerso == 'recto' ? '.recto' : '.verso') : undefined;
            //     this.$el.children(filter).css(name, value);
            // },

            css     : function(name, value) {
                this.$el.css(name, value);
            }

        });

        return PageView;
    }
);