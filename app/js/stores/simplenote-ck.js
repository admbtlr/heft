define(["stores/heft"],function(e){var t=function(t){this.baseUrl="/simplenote";this.email="ab@adam-butler.com";this.password="VertR0cks";this.ajaxQueue=new $.AjaxQueue;_.extend(this,e);_.extend(this,Backbone.Events)};_.extend(t.prototype,{authenticate:function(){if(typeof this.authString!="undefined")return!0;if(this.authPending)return!1;this.authPending=!0;var e=this.buildUrl("/api/login"),t=btoa("email="+this.email+"&password="+this.password),n=this;this.ajaxQueue.add({url:e,type:"POST",data:t,complete:function(e){n.authString=e.responseText;n.authPending=!1}});return!1},getAll:function(){this.getAllLocalNotes();this.getIndex()},getIndex:function(e){this.authenticate();var t=this;this.ajaxQueue.add({dataType:"json",complete:function(e){var n=JSON.parse(e.responseText);t.index||(t.index=[]);t.index=t.index.concat(n.data);if(n.mark){t.mark=n.mark;t.getIndex(n.mark)}else{t.mark=null;t.loadNotes()}},_run:function(e){var n={length:100,auth:t.authString,email:t.email};t.mark&&(n.mark=t.mark);e.url=t.buildUrl("/api2/index",n)}})},loadNotes:function(){this.index.sort(function(e,t){return t.createdate-e.createdate});for(var e=0;e<this.index.length;e++){var t=this.index[e].key;(!this.localData.notes[t]||this.localData.notes[t].modifydate<this.index[e].modifydate)&&this.get(this.index[e])}},get:function(e){this.getLocalNote(e.key);var t=this,n=this.buildUrl("/api2/data/"+e.key,{auth:t.authString,email:t.email});this.ajaxQueue.add({dataType:"json",complete:function(e){var n=JSON.parse(e.responseText);t.saveLocalNote(n);t.trigger("gotNote",n)},_run:function(n){n.url=t.buildUrl("/api2/data/"+e.key,{auth:t.authString,email:t.email})}})},update:function(e){this.saveLocalNote(e.attributes);if(!e.isContentDirty)return;var t=this.buildUrl("/api2/data/"+e.get("key"),{auth:this.authString,email:this.email}),n={content:e.get("content")};$.ajax({type:"post",url:t,contentType:"application/json",data:JSON.stringify(n)}).done(function(t,n){console.log(t);e.isDirty=undefined})},buildUrl:function(e,t){var n="";if(t){n="?";_.keys(t).map(function(e){n=n+e+"="+t[e]+"&"});t=n.slice(0,-1)}return this.baseUrl+e+n}});return t});