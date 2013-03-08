$('<div>').attr('id', 'pagePreviewTemplate');

// var sinonXhr = sinon.useFakeXMLHttpRequest(),
//     requests = [];

// sinonXhr.onCreate = function(xhr) {
//     requests.push(xhr);
// };


describe('App', function() {

    it('should be present', function() {
        should.exist(window.heft);
    });

    it('should have one notebook', function() {
        heft.models.notebook.should.be.an('object');
    });

    it('should have one selected Note', function() {
        var currentNoteView = heft.views.notebook.getCurrentNoteView();
        var currentNote = heft.models.notebook.getCurrentNote();
        should.exist(currentNoteView);
        currentNoteView.should.be.an('object');
        should.exist(currentNote);
        currentNote.should.be.an('object');
        currentNoteView.model.should.equal(currentNote);
    });

    it('should get NoteView selected Note', function() {
        heft.getNoteView(heft.selectedNote).should.be.an('object');
    });

    it('should change style of selected Note', function() {
        var oldStyle = heft.selectedNote.get('style'),
            // mock an event object with requisite content
            e = { data: { context: heft } };
        heft.selectedNote.get('style').should.equal(oldStyle);
        heft.setRandomStyleAndReplace(e);
        heft.selectedNote.get('style').should.not.equal(oldStyle);
    });

    it('should call callback when editNote is triggered', function() {
        var callback = sinon.spy();
        heft.on('editNote', callback);
        heft.trigger('editNote');
        callback.should.have.been.calledOnce;
    });

    it('should select next and previous notes when events are triggered', function() {
        var oldNote = heft.selectedNote;
        heft.trigger('selectNextNote');
        heft.selectedNote.should.not.equal(oldNote);
        heft.trigger('selectPreviousNote');
        heft.selectedNote.should.equal(oldNote);
    });
});
