define(['stores/heft'],

    function(HeftStore) {
        
        var SimpleNoteStore = function(app) {

            this.baseUrl = '/simplenote';
            this.email = 'ab@adam-butler.com';
            this.password = 'VertR0cks';
            this.ajaxQueue = new $.AjaxQueue();

            // does local storage and Mongo style storage
            _.extend(this, HeftStore);

            _.extend(this, Backbone.Events);

        };


        _.extend(SimpleNoteStore.prototype, {

            // returns true if we're authenticated,
            // or false if we're pending authentication,
            // in which case, join the back of the queue
            authenticate    : function() {
                // this doesn't mean that we actually _are_ authenticated...
                if (typeof this.authString !== 'undefined') {
                    return true;
                } else if (this.authPending) {
                    return false;
                }
                this.authPending = true;
                var url = this.buildUrl('/api/login'),
                    content = btoa('email='+this.email+'&password='+this.password),
                    context = this;
                this.ajaxQueue.add({
                    url     : url,
                    type    : 'POST',
                    data    : content,
                    complete: function(response) {
                        context.authString = response.responseText;
                        context.authPending = false;
                    }
                });
                return false;
            },

            getAll          : function() {

                // first get the notes from local storage, so that we're up and running asap
                this.getAllLocalNotes();
                
                this.getIndex();
            },

            getIndex        : function(mark) {
                if (this.authenticate()) {}
                var context = this;
                this.ajaxQueue.add({
                    dataType: 'json',
                    complete: function(response) {
                        var res = JSON.parse(response.responseText);

                        if (!context.index) {
                            context.index = [];
                        }
                        context.index = context.index.concat(res.data);

                        // are there more notes?
                        if (res.mark) {
                            context.mark = res.mark;
                            context.getIndex(res.mark);
                        } else {
                            context.mark = null;
                            context.loadNotes();
                        }
                    },
                    _run    : function(self) {
                        // delay URL building to ensure we've got an authString
                        var getVars = {
                            length  : 100,
                            auth    : context.authString,
                            email   : context.email
                        };
                        if (context.mark) {
                            getVars.mark = context.mark;
                        }
                        self.url = context.buildUrl('/api2/index', getVars);
                    }
                });
            },

            // load notes, given a list of objects with keys
            loadNotes       : function() {
                // reverse order...
                this.index.sort(function(a, b) { return b.createdate - a.createdate; });
                for (var i = 0; i < this.index.length; i++) {
                    var key = this.index[i].key;
                    if (!this.localData.notes[key] || this.localData.notes[key].modifydate < this.index[i].modifydate) {
                        this.get(this.index[i]);
                    }
                }
                // _.each(data, function(note) {
                // }, this);
            },

            get             : function(model) {

                this.getLocalNote(model.key);

                var context = this,
                    url = this.buildUrl('/api2/data/'+model.key, {
                            auth    : context.authString,
                            email   : context.email
                    });
                // $.getJson(url, function(response) {
                //         var note = $.parseJSON(response.responseText);
                //         context.saveLocal(note);
                //         context.trigger('gotNote', note);
                // });
                // $.ajax({
                //     url         : url,
                //     dataType    : 'json',
                //     success     : function(response) {
                //         var note = $.parseJSON(response.responseText);
                //         context.saveLocal(note);
                //         context.trigger('gotNote', note);
                //     }
                // });
                this.ajaxQueue.add({
                    dataType: 'json',
                    complete: function(response) {
                        var note = JSON.parse(response.responseText);
                        context.saveLocalNote(note);
                        context.trigger('gotNote', note);
                    },
                    _run    : function(self) {
                        // delay URL building to ensure we've got an authString
                        self.url = context.buildUrl('/api2/data/'+model.key, {
                            auth    : context.authString,
                            email   : context.email
                        });
                    }
                });
            },

            update          : function(model) {
                this.saveLocalNote(model.attributes);

                if (!model.isContentDirty) {
                    return;
                }

                // save to simplenote
                var url = this.buildUrl('/api2/data/'+model.get('key'), {
                    auth    : this.authString,
                    email   : this.email
                }),
                    data = { 'content': model.get('content') };
                $.ajax({
                    type: 'post',
                    url : url,
                    contentType : 'application/json',
                    data        : JSON.stringify(data)
                    }).
                    done(function(data, status) {
                        console.log(data);
                        model.isDirty = undefined;
                    });
            },

            buildUrl       : function(method, fields) {
                var fieldString = '';
                if (fields) {
                    fieldString = '?';
                    _.keys(fields).map(function(k) {
                        fieldString = fieldString + k+'='+fields[k] + '&';
                    });
                    fields = fieldString.slice(0, -1);
                }
                return this.baseUrl+method+fieldString;
            }

        });

        return SimpleNoteStore;

    }
);