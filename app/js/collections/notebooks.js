define(['models/notebook'],

    function(Notebook) {
        
        var Notebooks = Backbone.Collection.extend({
            
            model: Notebook

        });

        return Notebooks;
    }
);
