define(['models/note', 'localstorage'],

    function(Note) {

        var Notes = Backbone.Collection.extend({

            model: Note,

            localStorage: new Backbone.LocalStorage('notes'),

            initialize  : function() {
                this.fetch();
                this.bind('change', this.save);
            // },

            // setStore    : function(store) {
            //     this.store = store;
            //     store.on('gotNote', this.createOrUpdateNote, this);
            // },

            // createOrUpdateNote  : function(n) {
            //     var note = new Note(n);
            //     note.set('id', note.get('key'));
            //     this.add(note);
            }
        });

        return Notes;
    }
);
