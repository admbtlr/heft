define([],

    function() {

        /* 

        https://gist.github.com/2470554

        Allows for ajax requests to be run synchronously in a queue

        Usage::

        var queue = new $.AjaxQueue();

        queue.add({
          url: 'url',
          complete: function() {
            console.log('ajax completed');
          },
          _run: function(req) {
            //special pre-processor to alter the request just before it is finally executed in the queue
            req.url = 'changed_url'
          }
        });

        */

        $.AjaxQueue = function() {
            this.reqs = [];
            this.requesting = false;
        };
        $.AjaxQueue.prototype = {
            add: function(req) {
                this.reqs.push(req);
                this.next();
            },
            next: function() {
                if (this.reqs.length === 0) {
                    return;
                }

                if (this.requesting === true) {
                    return;
                }

                var req = this.reqs.splice(0, 1)[0];
                var complete = req.complete;
                var self = this;
                if (req._run) {
                    req._run(req);
                }
                req.complete = function() {
                    if (complete) {
                        complete.apply(this, arguments);
                    }
                    self.requesting = false;
                    self.next();
                };

                this.requesting = true;
                $.ajax(req);
            }
        };

        return $.AjaxQueue;

    }
);
