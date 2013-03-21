define(['models/note', 'text!templates/install.md', 'text!templates/welcome.md'],

    function(Note, installText, welcomeText) {

        var Notebook = Backbone.Model.extend({

            initialize  : function(notes) {
                var n;
                this.notes = notes;
                if (!window.navigator.standalone && notes.length === 0) {
                    n = new Note({
                        content: installText,
                        install: true
                    });
                    notes.add(n);
                    n.save();
                } else if (notes.length === 0 || notes.at(0).get('install')) {
                    notes.reset();
                    n = new Note({
                        content: welcomeText,
                        stylable: true
                    });
                    notes.add(n);
                    n.save();
                }
                // this.currentNote = notes.at(notes.length-1);
                this.currentNote = notes.at(notes.length - 1);
            },

            getCurrentNote  : function() {
                return this.currentNote;
            },

            getNextNote : function(n) {
                var note = n || this.currentNote;
                if (this.isLastNote(note)) {
                    this.notes.add(new Note({ content: '' }));
                }
                return this.notes.at(this.notes.indexOf(note) + 1);
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
