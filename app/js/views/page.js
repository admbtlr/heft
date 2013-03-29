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

            side2Image : function() {
                var canvas = $('#canvas')[0],
                    options = { width: 320, height: 460},
                    styleNode = $('<style> * { padding: 0; margin: 0; box-sizing: border-box; } .note { width: 320px; height: 460px; }</style');
                this.$el.prepend(styleNode);
                rasterizeHTML.drawHTML(this.$el.html(), canvas, options, function(image, failedResources) {
                    var xhr = new XMLHttpRequest();
                    xhr.onload = function() {
                        // get the XML tree of the SVG
                        var svgAsXml = xhr.responseXML;
                        // convert the XML tree to a string
                        var svgAsString = new XMLSerializer().serializeToString(svgAsXml);
                        $(svgAsString)[0].toDataURL('image/png', {
                            callback: function(data) {
                                $('<img>').attr('src', data).insertAfter($('#canvas'));
                            }
                        });
                    };
                    xhr.open("GET", image.src);
                    xhr.responseType = "document";
                    xhr.send();
                });
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