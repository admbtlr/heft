/* Author:
    Max Degterev @suprMax
    
    $.onshake(callb, sens);
    
    based on  http://www.jeffreyharrell.com/blog/2010/11/creating-a-shake-event-in-mobile-safari/
*/(function(e){typeof window.DeviceMotionEvent!="undefined"?e.onshake=function(e,t){var n=t||12,r=250,i=500,s=0,o=0,u=0,a=0,f=0,l=0,c=function(t){var h=Math.abs(s-a+(o-f)+(u-l));a=s;f=o;l=u;if(!t&&h>n){e.call(window);setTimeout(c,i,!0)}else setTimeout(c,r)};window.addEventListener("devicemotion",function(e){s=e.accelerationIncludingGravity.x;o=e.accelerationIncludingGravity.y;u=e.accelerationIncludingGravity.z},!1);c()}:e.onshake=function(){}})(Zepto);