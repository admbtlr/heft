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
        var currentNoteView = heft.views.notebook.getCurrentNoteView(),
            currentNote = heft.models.notebook.getCurrentNote();
        should.exist(currentNoteView);
        currentNoteView.should.be.an('object');
        should.exist(currentNote);
        currentNote.should.be.an('object');
        currentNoteView.model.should.equal(currentNote);
    });

    it('should change style of selected Note', function() {
        var currentNoteView = heft.views.notebook.getCurrentNoteView(),
            currentNote = heft.models.notebook.getCurrentNote(),
            oldStyle = currentNote.get('style'),
            // mock an event object with requisite content
            e = { data: { context: heft } };
        currentNote.get('style').should.equal(oldStyle);
        currentNote.set('stylable', true);
        Backbone.Mediator.pub('note:randomisestyle');
        currentNote.get('style').should.not.equal(oldStyle);
    });

    it('should call callback when editNote is triggered', function() {
        var callback = sinon.spy();
        heft.on('editNote', callback);
        heft.trigger('editNote');
        callback.should.have.been.calledOnce;
    });

});
