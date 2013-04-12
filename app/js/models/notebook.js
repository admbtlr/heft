define(['models/note', 'text!templates/install.md', 'text!templates/welcome.md', 'text!templates/next.md'],

    function(Note, installText, welcomeText, nextText) {

        var Notebook = Backbone.Model.extend({

            initialize  : function(notes) {
                var context = this,
                    n, n2;
                this.notes = notes;
                if (window.navigator.platform == 'iPhone' && !window.navigator.standalone) {
                    notes.reset();
                    n = new Note({
                        content: installText,
                        install: true
                    });
                    notes.add(n);
                    n.save();
                    this.currentNote = n;
                } else if (notes.length === 0 || notes.at(0).get('install')) {
                    notes.reset();
                    n = new Note({
                        content: welcomeText,
                        stylable: true,
                        pageFitted: false
                    });
                    notes.add(n);
                    n.save();
                    n2 = new Note({
                        content: nextText,
                        stylable: true,
                        pageFitted: false
                    });
                    notes.add(n2);
                    n2.save();
                    this.currentNote = n;
                } else {
                    this.currentNote = notes.at(notes.length - 1);
                }

                Backbone.Mediator.sub('note:selected', function(noteView) {
                    context.currentNote = noteView.model;
                });
            },

            getNote     : function(cid) {
                return this.notes.get(cid);
            },

            getCurrentNote  : function() {
                return this.currentNote;
            },

            getNextNote : function(n) {
                var note = n || this.currentNote;
                if (this.isLastNote(note)) {
                    // this.notes.add(new Note({ content: '' }));
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

            getLastNote : function() {
                // final page is blank, hence the "-2"
                return this.notes.at(this.notes.length - 2);
            },

            isLastNote      : function(n) {
                var note = n || this.currentNote;
                return this.notes.indexOf(note) === this.notes.length - 1;
            },

            isFirstNote      : function(n) {
                var note = n || this.currentNote;
                return this.notes.indexOf(note) === 0;
            },

            createNote      : function() {
                var n = new Note({ content: '' }),
                    index = this.notes.indexOf(this.currentNote) + 1;
                this.notes.add(n, {at: index});
                return n;
            },

            getCurrent16Block   : function() {
                return this.get16Block(this.currentNote);
            },

            // takes either the block index (starting from 0) or a note within the block
            get16Block  : function(n) {
                var blockIndex = _.isNumber(n) ? n : this.get16BlockIndex(n),
                    blockStart = blockIndex * 16,
                    blockEnd = blockStart + 16 > this.notes.length ? this.notes.length : blockStart + 16;
                return this.notes.slice(blockStart, blockEnd);
            },

            get16BlockIndex : function(note) {
                var noteIndex = this.notes.indexOf(note);
                return Math.floor(noteIndex / 16);
            },

            getNum16Blocks  : function() {
                var div = this.notes.length / 16;
                return Math.round(div) == div ? div : Math.floor(div) + 1;
            }
        });

    return Notebook;
});
