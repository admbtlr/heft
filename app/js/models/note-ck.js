define(["themes/default"],function(e){var t=Backbone.Model.extend({defaults:{},getModifyDateAsString:function(){if(!this.get("modifydate"))return"";var e=new Date(this.get("modifydate")*1e3);return e.toDateString()===(new Date).toDateString()?e.getHours()+":"+e.getMinutes():e.getDate()+"/"+(e.getMonth()+1)+"/"+e.getFullYear().toString().substring(2)},setRandomStyle:function(){this.set("pageFitted",!1);this.set("style",e.getTheme(this));this.save()}});return t});