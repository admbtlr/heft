define(["collections/notes","models/notebook","views/app","views/notebook","views/pageButtons"],function(e,t,n,r,i){var s=function(){_.extend(this,Backbone.Events);this.views.app=new n({app:this});this.collections.notes=new e;this.models.notebook=new t(this.collections.notes);this.views.notebook=new r({model:this.models.notebook,app:this});this.views.notebook.render();this.views.pageButtons=new i({app:this});$.onshake(function(){Backbone.Mediator.pub("note:randomisestyle")});var s=$(".main")[0];s.addEventListener("touchstart",function(e){startY=e.touches[0].pageY;startTopScroll=s.scrollTop;startTopScroll<=0&&(s.scrollTop=1);startTopScroll+s.offsetHeight>=s.scrollHeight&&(s.scrollTop=s.scrollHeight-s.offsetHeight-1)},!1)};s.prototype={views:{},collections:{},models:{},randomiseCurrentNote:function(){}};return s});