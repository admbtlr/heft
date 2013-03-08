define(['models/note', 'collections/notes', 'views/note', 'stores/simplenote'],

    function(Note, Notes, NoteView, SimpleNoteStore) {

        var Test2View = Backbone.View.extend({
            el          : $('.main'),
            events      : {
                'click .preview-buttons .close-button'  : 'deselectNote',
                'click .preview-buttons .edit-button'   : function() { this.trigger('editNote'); },
                'click .preview-buttons .next-button'   : function() { this.trigger('selectNextNote'); },
                'click .preview-buttons .prev-button'   : function() { this.trigger('selectPreviousNote'); },
                'click .edit-buttons .ok-button'        : function() { this.trigger('saveNote'); }
            },

            // keyed on note ids
            noteViews   : {},

            // some display settings
            pageWidth   : 480,
            pageHeight  : 690,
            portholeWidth   : 120,

            filter      : '',

            initialize  : function() {
            },

            render      : function() {
                this.$el.css('display', 'none');
                _.each(this.app.collections.notes.models, function(model) {
                    if (!this.getNoteView(model)) {
                        this.renderNote(model);
                    }
                }, this);
                this.$el.css('display', '');
            }

         });

        return Test2View;
    }
);
