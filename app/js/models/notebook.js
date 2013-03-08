define([],

    function() {

        var Notebook = Backbone.Model.extend({

            initialize  : function(notes) {
                this.notes = notes;
                this.currentNote = notes.at(0);
            },

            getCurrentNote  : function() {
                return this.currentNote;
            },

            getNextNote : function(n) {
                var note = n || this.currentNote;
                if (this.isLastNote(note)) {
                    return null;
                } else {
                    return this.notes.at(this.notes.indexOf(note) + 1);
                }
            },

            getPrevNote : function(n) {
                var note = n || this.currentNote;
                if (this.isFirstNote(note)) {
                    return null;
                } else {
                    return this.notes.at(this.notes.indexOf(note) - 1);
                }
            },

            isLastNote      : function(n) {
                var note = n || this.currentNote;
                return this.notes.indexOf(note) === this.notes.length - 1;
            },

            isFirstNote      : function(n) {
                var note = n || this.currentNote;
                return this.notes.indexOf(note) === 0;
            }
        });

    return Notebook;
});
