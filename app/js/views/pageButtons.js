define(['text!templates/page-buttons.html'],

    function(template) {

        var PageButtonsView = Backbone.View.extend({

            template    : _.template(template),

            isVisible   : false,

            events      : {
                'click .randomise-button'  : function() { 
                    this.app.trigger('randomStyle'); 
                    return false; 
                },
                'click .preview-buttons .edit-button'   : function() { this.trigger('randomStyle'); },
                'click .preview-buttons .next-button'   : function() { this.trigger('selectNextNote'); },
                'click .preview-buttons .prev-button'   : function() { this.trigger('selectPreviousNote'); },
                'click .edit-buttons .ok-button'        : function() { this.trigger('saveNote'); }
            },

            initialize  : function(conf) {
                this.app = conf.app;
                this.app.on('noteSelected', this.affixButtons, this);
                this.$el.on('click', '.randomise-button', function() {
                    this.app.trigger('randomStyle');
                });
                Backbone.Mediator.sub('noteselected', this.affixButtons, this);
                Backbone.Mediator.sub('note:styleupdated', this.affixButtons, this);
                Backbone.Mediator.sub('notebook:mouseclick', this.toggleButtons, this);
                Backbone.Mediator.sub('notebook:pageturnstart', this.hideButtons, this);
                Backbone.Mediator.sub('notebook:mouseswipe', this.hideButtons, this);
                Backbone.Mediator.sub('notebook:mousescroll', this.hideButtons, this);
            },

            affixButtons    : function(page) {
                var pb = [],
                    visible = this.buttonsAreVisible();

                // get all the page-button instances
                $('.page-buttons').each(function() {
                    if ($(this).parent() != page.getEl()) {
                        $(this).remove();
                    }
                });

                var $noteEl = page.getNote().$el,
                    $buttonsEl = $noteEl.children('.page-buttons'),
                    bgColor = page.getNote().model.get('style').bgColor,
                    bgColorString = 'rgb('+bgColor[0]+','+bgColor[1]+','+bgColor[2]+')',
                    contrastingColor = this.calculateContrastingColor(bgColorString);
                if ($buttonsEl.length === 0) {
                    $buttonsEl = $(this.template());
                    $noteEl.append($buttonsEl);
                    this.addEvents($buttonsEl);
                }
                $buttonsEl.css('background-color', bgColorString)
                    .css('border-top', '1px solid '+contrastingColor)
                    .children('a').css('color', contrastingColor);
                $buttonsEl.show();

                if (visible) {
                    this.showButtons();
                }

                $buttonsEl.on('mousedown mouseup mousemove touchstart touchend touchmove', function(e) {
                    e.stopPropagation();
                });
            },

            addEvents       : function($buttonsEl) {
                $buttonsEl.children('.randomise-button').on('click', function() { Backbone.Mediator.pub('note:randomisestyle'); });
                $buttonsEl.children('.edit-button').on('click', function() { Backbone.Mediator.pub('note:edit'); });
            },

            toggleButtons   : function() {
                if (this.buttonsAreVisible()) {
                    this.hideButtons();
                } else {
                    this.showButtons();
                }
            },

            showButtons : function() {
                $('.page-buttons').show();
                $('.page-buttons').css('box-shadow', 'rgba(0, 0, 0, 0.3) 0 0 3px');
                $('.page-buttons').css('bottom', '0px');
                this.isVisible = true;
            },

            hideButtons : function() {
                if (this.isVisible) {
                    $('.page-buttons').css('box-shadow', '');
                    $('.page-buttons').css('bottom', '-60px');
                }
                this.isVisible = false;
            },

            buttonsAreVisible    : function() {
                return $('.page-buttons').css('bottom') == '0px';
            },

            calculateContrastingColor   : function(rgbString) {
                var rgbArray = _.map(rgbString.slice(4, -1).split(','), function(x) { return Number(x); }),
                    isDark = _.reduce(rgbArray, function(memo, num) { return memo + num; }, 0) / 3 < 128,
                    multiplier = isDark ? 255 : 0,
                    contrastRgbArray = _.map(rgbArray, function(num) { return Math.round((num + 3*multiplier) / 4); });
                return 'rgb('+contrastRgbArray[0]+','+contrastRgbArray[1]+','+contrastRgbArray[2]+')';
            }


        });

        return PageButtonsView;

    }
);