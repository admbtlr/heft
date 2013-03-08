define(['themes/default'],

    function(theme) {

        var Note = Backbone.Model.extend({

            defaults    : {},

            getModifyDateAsString   : function() {
                if (!this.get('modifydate')) {
                    return '';
                }
                var d = new Date(this.get('modifydate') * 1000);
                if (d.toDateString() === new Date().toDateString()) {
                    return d.getHours()+':'+d.getMinutes();
                } else {
                    return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear().toString().substring(2);
                }
            },

            setRandomStyle  : function() {
                this.set('pageFitted', false);
                // this.set('style', this.makeRandomStyle());
                this.set('style', theme.getTheme(this));
                this.save();
            },


        });
    
        return Note;

    }
);

