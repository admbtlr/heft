define(['stores/ajax-queue'],

    function(AjaxQueue) {
        
        var HeftStore = {

            name    : 'heft',

            localStore  : localStorage.getItem(this.name),

            initLocalStore  : function() {
                if (!this.localData) {
                    this.localData = (localStorage.getItem(this.name) && JSON.parse(localStorage.getItem(this.name))) || {};
                }
                if (!this.localData.notes) {
                    this.localData.notes = {};
                }
            },

            saveNote    : function() {
                localStorage.setItem(this.name, JSON.stringify(this.localData));
            },

            getLocalNote    : function(key) {
                if (this.localData.notes[key]) {
                    this.trigger('gotNote', this.localData.notes[key]);
                }
            },

            getAllLocalNotes: function() {
                this.initLocalStore();
                var sortedKeys = _.keys(this.localData.notes).sort(function(a, b) { return a.modifydate - b.modifydate; }),
                    tempData = {};

                _.each(sortedKeys, function(key) { 
                    tempData[key] = this.localData.notes[key]; 
                }, this);
                this.localData.notes = tempData;

                _.each(_.keys(this.localData.notes), function(key) { this.getLocalNote(key); }, this);
            },

            saveLocalNote   : function(model) {
                this.initLocalStore();
                var storedModel = this.localData.notes[model.key];

                // only save if newer than stored model
                if (!storedModel) {
                    this.localData.notes[model.key] = model;
                } else if (storedModel !== model) {
                    // if it's coming from outside Heft, it won't have any style...
                    if (!model.style && storedModel) {
                        var style = storedModel.style;
                        this.localData.notes[model.key] = model;
                        this.localData.notes[model.key].style = style;
                    } else {
                        this.localData.notes[model.key] = model;
                    }
                }
                this.saveNote();
            }

        };

        HeftStore.initLocalStore();

        return HeftStore;
    }
);
