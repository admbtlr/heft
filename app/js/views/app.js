define(['models/note', 'collections/notes', 'views/note', 'stores/simplenote'],

    function(Note, Notes, NoteView, SimpleNoteStore) {

        var AppView = Backbone.View.extend({
            el          : $('.main'),
            // events      : {
            //     'click .page-buttons .randomise-button'  : function() { this.app.trigger('randomStyle'); },
            //     'click .preview-buttons .edit-button'   : function() { this.trigger('randomStyle'); },
            //     'click .preview-buttons .next-button'   : function() { this.trigger('selectNextNote'); },
            //     'click .preview-buttons .prev-button'   : function() { this.trigger('selectPreviousNote'); },
            //     'click .edit-buttons .ok-button'        : function() { this.trigger('saveNote'); }
            // },

            // keyed on note ids
            noteViews   : {},

            // some display settings
            pageWidth   : 480,
            pageHeight  : 690,
            portholeWidth   : 120,

            filter      : '',

            initialize  : function(conf) {
                this.app = conf.app;
                // // this.notebooks = new Notebooks();

                this.on('editNote', this.editNote, this);
                this.on('saveNote', this.saveNote, this);
                this.on('selectNextNote', this.selectNextNote, this);
                this.on('selectPreviousNote', this.selectPreviousNote, this);

                this.$el.on('click', '.page-buttons .randomise-button', $.proxy(function(e) {
                    this.trigger('randomiseStyle');
                }, this));

                // $('#search-bar').keyup(function() {
                //     var val = $('#search-bar').val();
                //     if (val.length === 0) {
                //         $('#search-bar').css('color', 'rgb(180, 180, 160)');
                //         $('#search-bar').val('Search or Create');
                //         $('#search-bar')[0].setSelectionRange(0);
                //     } else if (val.length > 2 && val !== 'Search or Create') {
                //         app.filterNotes(val);
                //     } else {
                //         app.filterNotes('');
                //     }
                // });
                // $('#search-bar').keydown(function() {
                //     if ($('#search-bar').val() === 'Search or Create') {
                //         $('#search-bar').css('color', 'rgb(0, 0, 0)');
                //         $('#search-bar').val('');
                //     }
                // });
                // $('#search-bar').focus(function() {
                //     if ($('#search-bar').val() === 'Search or Create') {
                //         $('#search-bar')[0].setSelectionRange(0);
                //     }
                // });
            },

            // affixButtons    : function(noteView) {
            //     var $element = noteView.noteRecto.$el,
            //         $noteEl = $element.children('.note'),
            //         elementBgColor = $noteEl.css('background-color'),
            //         contrastingColor = this.calculateContrastingColor(elementBgColor);

            //     this.hideButtons();
            //     $('.preview-buttons').remove().appendTo($element)
            //         .css('background-color', elementBgColor)
            //         .css('border-top', '1px solid '+contrastingColor)
            //         .children('a').css('color', contrastingColor);
            //     $('.preview-buttons').show();
            // },

            // toggleButtons   : function() {
            //     if (this.buttonsAreVisible()) {
            //         this.hideButtons();
            //     } else {
            //         this.showButtons();
            //     }
            // },

            // showButtons : function() {
            //     $('.preview-buttons').css('box-shadow', 'rgba(0, 0, 0, 0.5) 0 0 10px');
            //     $('.preview-buttons').css('bottom', '0px');
            // },

            // hideButtons : function() {
            //     if (this.buttonsAreVisible()) {
            //         $('.preview-buttons').bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
            //             $('.preview-buttons').unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
            //             $('.preview-buttons').css('box-shadow', '');
            //         });
            //         $('.preview-buttons').css('bottom', '-60px');
            //     }
            // },

            // buttonsAreVisible    : function() {
            //     return $('.preview-buttons').css('bottom') == '0px';
            // },

            render      : function() {
                this.$el.css('display', 'none');
                _.each(this.app.collections.notes.models, function(model) {
                    if (!this.getNoteView(model)) {
                        this.renderNote(model);
                    }
                }, this);
                this.$el.css('display', '');
            },

            renderNote   : function(model) {
                if (!model.get('style')) {
                    model.setRandomStyle();
                }
                var noteView = new NoteView({
                    model: model
                });
                this.noteViews[model.get('id')] = noteView;

                var $clearFix = this.$el.children('.tiles').children('.cf').detach();
                this.$el.children('.tiles').append(noteView.render().el).append($clearFix);

                noteView.on('selected', function(model) {
                    this.selectNote(model);
                }, this);

                if (!this.selectedNote) {
                    this.selectNote(model);
                }

            },

            getNoteView : function(note) {
                return _.find(this.noteViews, function(nv) { return nv.model === note; }, this);
            },

            filterNotes : function(filter) {
                if (this.filter === filter) {
                    return;
                }
                var searchReg = new RegExp(filter, 'ig');

                this.filter = filter;
                $('.notes').css('display', 'none');
                // reverse models so that hiding/showing causes less reflow
                this.notes.models.reverse();
                _.each(this.notes.models, function(note) {
                    if (note.get('content').search(searchReg) === -1) {
                        this.getNoteView(note).hide();
                    } else {
                        this.getNoteView(note).show();
                    }
                }, this);
                this.notes.models.reverse();
                $('.notes').css('display', '');
            },

            toggleNote  : function(note) {
                if (note.get('isSelected')) {
                    this.selectNote(note);
                } else {
                    this.deselectNote(note);
                }
            },

            selectNote  : function(note) {
                // close the note that's already shown
                if (this.selectedNote) {
                    this.deselectNote();
                }
                this.selectedNote = note;
                var context = this,
                    selectedNoteView = this.getNoteView(note),
                    $element = selectedNoteView.$el.children('.porthole').clone()
                                .removeClass('porthole')
                                .addClass('active-note-display')
                                .addClass('flip-face'),
                    elementBgColor = $element.children('.note').css('background-color'),
                    contrastingColor = this.calculateContrastingColor(elementBgColor);

                $element.prependTo('.flip-holder');
                $element.dblclick($.proxy(this.editNote, this));
                $element.click({'context': this}, this.setRandomStyleAndReplace);

                $('.edit-pane').val(this.selectedNote.get('content'));

                selectedNoteView.$el.addClass('selected-note');

                $('.preview-buttons').detach().appendTo($element)
                    .css('background-color', elementBgColor)
                    .css('border-top', '1px solid '+contrastingColor)
                    .children('a').css('color', contrastingColor)
                    .end().show();

                window.setTimeout(function() { context.flipNote(selectedNoteView); }, 100);
            },

            selectNextNote  : function() {
                if (!this.selectedNote) {
                    return;
                }
                var index = this.app.notes.indexOf(this.selectedNote);
                if (typeof index !== 'undefined' && index < this.app.notes.length - 1) {
                    this.selectNote(this.app.notes.models[index+1]);
                }
            },

            selectPreviousNote  : function() {
                if (!this.selectedNote) {
                    return;
                }
                var index = this.app.notes.indexOf(this.selectedNote);
                if (typeof index !== 'undefined' && index > 0) {
                    this.selectNote(this.app.notes.models[index-1]);
                }
            },

            flipNote            : function(note) {
                note.$el.toggleClass('note-spinner');
            },

            setRandomStyleAndReplace : function(e) {

                // hitting a button (font awesome stylee)? ignore...
                if ($(e.target).is('i')) {
                    return;
                }

                var $newElement,
                    context = e.data.context,
                    selectedNoteView = context.getNoteView(context.selectedNote),
                    elementBgColor,
                    contrastingColor;

                context.selectedNote.setRandomStyle();
                context.flipNote(selectedNoteView);
                $newElement = selectedNoteView.$el.children('.porthole').clone();
                elementBgColor = $newElement.children('.note').css('background-color'),
                contrastingColor = context.calculateContrastingColor(elementBgColor);

                $('.preview-buttons').detach().appendTo(context.$el).hide();

                $(this).replaceWith($newElement
                            .removeClass('porthole')
                            .addClass('active-note-display')
                            .addClass('flip-face'));
                $newElement.click({'context': context}, context.setRandomStyleAndReplace);
                $('.preview-buttons').detach().appendTo($newElement)
                    .css('background-color', elementBgColor)
                    .css('border-top', '1px solid '+contrastingColor)
                    .children('a').css('color', contrastingColor)
                    .end().show();
            },

            deselectNote    : function() {
                var selectedNoteView = this.getNoteView(this.selectedNote);

                $('.preview-buttons').detach().appendTo(this.$el).hide();

                $('.active-note').children('.flip-holder').removeClass('flip-me');
                $('.active-note').children('.flip-holder').children('.active-note-display').remove();

                $('.edit-pane').val('');

                this.selectedNote.set('isSelected', false);
                selectedNoteView.$el.removeClass('selected-note');
                this.selectedNote = null;
            },

            editNote        : function() {
                $('.flip-holder').toggleClass('flip-me');
            },

            saveNote        : function() {
                var selectedNoteView = this.getNoteView(this.selectedNote);
                if ($('.edit-pane').val() !== this.selectedNote.get('content')) {
                    this.selectedNote.isDirty = true;
                    this.selectedNote.set('content', $('.edit-pane').val());
                }
                this.selectedNote.set('pageFitted', false);
                selectedNoteView.render();
                this.selectedNote.save();
                this.flipNote(selectedNoteView);

                $('.preview-buttons').detach().appendTo(this.$el).hide();
                $('.active-note-display').html(selectedNoteView.$el.children('.porthole').html());
                $('.preview-buttons').detach().appendTo('.active-note-display').show();

                $('.flip-holder').toggleClass('flip-me');
            },

            calculateContrastingColor   : function(rgbString) {
                var rgbArray = _.map(rgbString.slice(4, -1).split(','), function(x) { return Number(x); }),
                    isDark = _.reduce(rgbArray, function(memo, num) { return memo + num; }, 0) / 3 < 128,
                    multiplier = isDark ? 255 : 0,
                    contrastRgbArray = _.map(rgbArray, function(num) { return Math.round((num + 3*multiplier) / 4); });
                return 'rgb('+contrastRgbArray[0]+','+contrastRgbArray[1]+','+contrastRgbArray[2]+')';
            },

            // http://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes
            webkitRender    : function(el) {
                el.style.display = 'none';
                el.offsetHeight;
                el.style.display = 'block';        
            }
        });

        return AppView;
    }
);
