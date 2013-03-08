define(['collections/notes', 'models/notebook', 'views/app', 'views/notebook', 'views/pageButtons', 'stores/simplenote'],

    function(Notes, Notebook, AppView, NotebookView, PageButtonsView, SimpleNoteStore) {

        // override sync to use our store(s)
        Backbone.sync = function(method, model, options) {

            var resp;
            var store = model.store || model.collection.store;

            switch (method) {
                case "read":    resp = model.id ? store.get(model) : store.getAll();    break;
                case "create":  resp = store.create(model);                             break;
                case "update":  resp = store.update(model);                             break;
                case "delete":  resp = store.destroy(model);                            break;
            }

            if (resp) {
                options.success(resp);
            } else {
                options.error("Note not found");
            }
        };

        var App = function() {

            _.extend(this, Backbone.Events);

            this.views.app = new AppView({'app': this});

            this.collections.notes = new Notes();
            this.collections.notes.on('add', this.render, this);

            this.collections.notes.setStore(new SimpleNoteStore());
            this.collections.notes.store.getAll();

            this.notes = this.collections.notes;

            this.models.notebook = new Notebook(this.notes);

            this.views.notebook = new NotebookView({'model': this.models.notebook, 'app': this});

            // this.views.notebook.on('noteSelected', this.views.app.affixButtons, this.views.app);

            this.views.notebook.render();

            this.views.pageButtons = new PageButtonsView({'app': this});

            this.views.notebook.on('notebookMouseClick', this.views.pageButtons.toggleButtons, this.views.pageButtons);
            this.views.notebook.on('notebookMouseSwipe', this.views.pageButtons.hideButtons, this.views.pageButtons);
            this.views.notebook.on('notebookMouseScroll', this.views.pageButtons.hideButtons, this.views.pageButtons);
            this.views.notebook.on('notebookTurnStart', this.views.pageButtons.hideButtons, this.views.pageButtons);
            this.views.notebook.on('notebookTurnEnd', function() {
                var nb = this.views.notebook;
                this.trigger('noteSelected', nb.currentPage, nb.getPrevPage(), nb.getNextPage());
            }, this);

            this.views.app.on('randomiseStyle', $.proxy(function() {
                this.views.notebook.getCurrentNoteView().model.setRandomStyle();
                this.views.pageButtons.affixButtons(this.views.notebook.getCurrentPageView());
            }, this));

            var that = this;
            // $.onshake(function() {
            //     that.views.notebook.currentPage.noteRecto.model.setRandomStyle();
            // });

            // this.collections.lists = new TaskLists();
            // this.views.listMenu = new ListMenuView({ collection: this.collections.lists });
        };

        App.prototype = {
            views: {},
            collections: {},
            models: {},

            randomiseCurrentNote    : function() {
            }
        };

        return App;
    }
);
