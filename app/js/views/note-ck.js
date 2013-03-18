define(["text!templates/note.html","text!templates/note-edit.html"],function(e,t){var n=new Showdown.converter,r=Backbone.View.extend({tagName:"a",className:"tile",template:_.template(e),editTemplate:_.template(t),events:{},initialize:function(){this.model.bind("change:style change:content",this.render,this)},render:function(){var e=this.template(this.toJSON());if(this.model.get("content").length===0)this.showEditView();else{this.$el.children(".note").length>0?this.$el.children(".note").replaceWith($(e)):this.$el.html(e);this.renderStyle()}return this},hide:function(){this.$el.css("display","none")},show:function(){this.$el.css("display","")},showEditView:function(){var e=this.editTemplate(this.toJSON(!0)),t=$(e),n;this.$el.append(t);t.on("mousedown mouseup mousemove touchstart touchend touchmove",function(e){e.stopPropagation()});n=this.$el.find("textarea");window.setTimeout(function(){n.focus()},550);n.one("blur",$.proxy(this.hideEditView,this))},hideEditView:function(){var e=this.$el.find(".note-edit"),t=e.find("textarea"),n=t.val();if(n.length===0){Backbone.Mediator.pub("note:predestroy",this);this.model.destroy()}else{this.model.set("stylable",!0);this.model.set("content",n);this.model.save();e.remove()}},renderStyle:function(){var e=this.$el.find(".note"),t=this.model.get("style"),n={},r=[],i=[];if(!t){this.model.setRandomStyle();t=this.model.get("style")}e.attr("style","");e.children().attr("style","");this.addOrRemoveSpans(e,t);var s=this;_.each(_.keys(t),function(o){if(o.substring(0,1)==="$")t[o]?r.push(s.styleHyphenFormat(o.substring(1))):i.push(s.styleHyphenFormat(o.substring(1)));else if(o.indexOf("__")!==-1){var u=o.split("__"),a=u[0].split("_"),f="";_.each(a,function(e){f+=e+" "});e.find(f).css(s.styleHyphenFormat(u[1]),t[o])}else n[o]=t[o]});e.css(n);e.addClass(_.reduce(r,function(e,t){return e+t+" "},""));e.removeClass(_.reduce(i,function(e,t){return e+t+" "},""));e.height()>0&&!this.model.get("pageFitted")&&this.fitToPage()},addOrRemoveSpans:function(e,t){var n=e.children("h1").first(),r,i;if(t.h1_span__color){i=n.html();r=$("<span></span>").html(i);n.html("").append(r)}else if(n.children("span").length>0){r=$("h1").children("span");i=r.html();n.html(i);r.remove()}},styleHyphenFormat:function(e){function t(e){return"-"+e.toLowerCase()}return e.replace(/[A-Z]/g,t)},fitToPage:function(){var e=this.$el.find(".note"),t=Number(this.model.get("style").fontSize.slice(0,-2)),n=Number(this.model.get("style").h1__fontSize.slice(0,-2)),r=Number(this.model.get("style").p__marginTop.slice(0,-2)),i=this.model.get("style").lineHeight,s=this.model.get("style").h1__lineHeight,o=Number(this.model.get("style").padding.slice(0,-2)),u=this.outerHeight(e),a=this.outerWidth(e);console.log(e.height()+"::"+u+"::"+e.width()+"::"+a+"::"+t);while((u>e.height()||a>e.width())&&t>28){console.log(e.height()+"::"+u+"::"+e.width()+"::"+a+"::"+t+"::"+n);u=0;t=Math.round(t*.9);n=n<1.4?n:n*.9;h1ineHeight=Math.round(s*.9);r=Math.round(r*.9);o=Math.round(o*.8);e.css("font-size",t+"px");e.css("padding",o+"px");e.children("h1").css("font-size",n+"em");e.children("h1").css("line-height",s);u=this.outerHeight(e);a=this.outerWidth(e)}console.log(e.height()+"::"+u+"::"+e.width()+"::"+a+"::"+t+"::"+n);var f=e.height()-u,l=f>0?[o,f/2,f-o][Math.round(Math.random()*2)]:Math.round(Math.random()*30);this.model.get("style").fontSize=t+"px";this.model.get("style").padding=l+"px "+o+"px "+o+"px";this.model.get("style").h1__fontSize=n+"em";this.model.get("style").h1__lineHeight=s;this.model.get("style").p__marginTop=r+"px";this.model.set("pageFitted",!0);this.renderStyle()},outerHeight:function(e){var t=Number(e.css("padding").slice(0,-2))*2,n=0,r,i;e.children().each(function(){r=Number($(this).css("margin-top").slice(0,-2));i=Number($(this).css("margin-bottom").slice(0,-2));t+=$(this).height();t+=r>n?r:n;n=i});t+=n;return t},outerWidth:function(e){var t=0,n=Number(e.css("padding").slice(0,-2))*2,r=Number(e.css("border-width").slice(0,-2))*2;e.children().each(function(){var e=this.scrollWidth;e>t&&(t=e)});return t+n+r},toJSON:function(e){return e?{content:this.model.get("content")}:{title:this.smarten(this.model.get("content").split("\n")[0].substr(0,30)),content:this.makeLinks(n.makeHtml("#"+this.smarten(this.model.get("content")))),modifyDate:this.model.getModifyDateAsString(),id:this.model.cid}},makeLinks:function(e){return e.replace(/http.*/gi,'[<a href="$1" target="_blank">...</a>]')},smarten:function(e){e=e.replace(/(^|[-\u2014\s(\["])'/g,"$1‘");e=e.replace(/'/g,"’");e=e.replace(/(^|[-\u2014/\[(\u2018\s])"/g,"$1“");e=e.replace(/"/g,"”");e=e.replace(/--/g,"—");return e}});return r});