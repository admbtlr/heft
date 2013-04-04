describe('Note', function() {

    it('should render content to using markdown', function() {
        var nv = heft.views.notebook.getCurrentNoteView();
        nv.renderContent().should.contain('<h1');
    });
});    

