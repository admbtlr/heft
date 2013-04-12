describe('Note', function() {


    it('should render content to using markdown', function() {
        var nv = heft.views.notebook.getCurrentNoteView();
        nv.renderContent().should.contain('<h1');
    });

    it('should change its content when edited', function() {
        var nv = heft.views.notebook.getCurrentNoteView(),
            content = 'This is some new content';
        nv.showEditView();
        nv.$el.parent().find('textarea').val(content);
        nv.hideEditView();
        nv.model.get('content').should.equal(content);
    });

    it('should become stylable when edited', function() {
        var nv = heft.views.notebook.getCurrentNoteView(),
            content = 'This is some new content';
        nv.model.set('stylable', false);
        nv.showEditView();
        nv.$el.parent().find('textarea').val(content);
        nv.hideEditView();
        nv.model.get('stylable').should.equal(true);
    });

});    

