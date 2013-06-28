(function(){
	
	// Creating a regular jQuery plugin:
	
	$.fn.tzShutter = function(options){
		
		// Checking for canvas support. Works in all modern browsers:
		var supportsCanvas = 'getContext' in document.createElement('canvas');

		// Providing default values:

		options = $.extend({
			openCallback:function(){},
			closeCallback:function(){},
			loadCompleteCallback:function(){},
			hideWhenOpened:true,
			imgSrc: 'jquery.shutter/shutter.png'
		},options);
		
		var element = this;
	
		if(!supportsCanvas){
			
			// If there is no support for canvas, bind the
			// callack functions straight away and exit:
			
			element.bind('shutterOpen',options.openCallback)
				   .bind('shutterClose',options.closeCallback);
			
			options.loadCompleteCallback();

			return element;
		}
		
		window.setTimeout(function(){
	
			var frames = {num:15, height:1000, width:1000},
				slices = {num:8, width: 416, height:500, startDeg:30},
				animation = {
					width : element.width(),
					height : element.height(),
					offsetTop: (frames.height-element.height())/2
				},
				
				// This will calculate the rotate difference between the
				// slices of the shutter. (2*Math.PI equals 360 degrees in radians):
				
				rotateStep = 2*Math.PI/slices.num, 
				rotateDeg = 30;

			// Calculating the offset			
			slices.angleStep = ((90 - slices.startDeg)/frames.num)*Math.PI/180;
			
			// The shutter slice image:
			var img = new Image();
		
			// Defining the callback before setting the source of the image:
			img.onload = function(){

				window.console && console.time && console.time("Generating Frames");
				
				// The film div holds 15 canvas elements (or frames).
				
				var film = $('<div>',{
					className: 'film',
					css:{
						height: frames.num*frames.height,
						width: frames.width,
						marginLeft: -frames.width/2, // Centering horizontally
						top: -animation.offsetTop
					}
				});

				// The animation holder hides the film with overflow:hidden,
				// exposing only one frame at a time.
				
				var animationHolder = $('<div>',{
					className: 'shutterAnimationHolder',
					css:{
						width:animation.width,
						height:animation.height
					}
				});
				
				for(var z=0;z<frames.num;z++){
	
					// Creating 15 canvas elements.
	
					var canvas	= document.createElement('canvas'),
						c		= canvas.getContext("2d");
	
					canvas.width=frames.width;
					canvas.height=frames.height;
	
					c.translate(frames.width/2,frames.height/2);
	
					for(var i=0;i<slices.num;i++){
						
						// For each canvas, generate the different
						// states of the shutter by drawing the shutter
						// slices with a different rotation difference.
						
						// Rotating the canvas with the step, so we can
						// paint the different slices of the shutter.
						c.rotate(-rotateStep);
						
						// Saving the current rotation settings, so we can easily revert
						// back to them after applying an additional rotation to the slice.
						
						c.save();
						
						// Moving the origin point (around which we are rotating
						// the canvas) to the bottom-center of the shutter slice.
						c.translate(0,frames.height/2);
						
						// This rotation determines how widely the shutter is opened.
						c.rotate((frames.num-1-z)*slices.angleStep);
						
						// An additional offset, applied to the last five frames,
						// so we get a smoother animation:
						
						var offset = 0;
						if((frames.num-1-z) <5){
							offset = (frames.num-1-z)*5;
						}
						
						// Drawing the shutter image
						c.drawImage(img,-slices.width/2,-(frames.height/2 + offset));
						
						// Reverting back to the saved settings above.
						c.restore();
					}
					
					// Adding the canvas (or frame) to the film div.
					film.append(canvas);
				}
				
				// Appending the film to the animation holder.
				animationHolder.append(film);
				
				if(options.hideWhenOpened){
					animationHolder.hide();
				}
				
				element.css('position','relative').append(animationHolder);
				
				var animating = false;
				
				// Binding custom open and close events, which trigger
				// the shutter animations.
				
				element.bind('shutterClose',function(){
					
					if(animating) return false;
					animating = true;
					
					var count = 0;
					
					var close = function(){
						
						(function animate(){
							if(count>=frames.num){
								animating=false;
								
								// Calling the user provided callback.
								options.closeCallback.call(element);
								
								return false;
							}
							
							film.css('top',-frames.height*count - animation.offsetTop);
							count++;
							setTimeout(animate,20);
						})();
					}
					
					if(options.hideWhenOpened){
						animationHolder.fadeIn(60,close);
					}
					else close();
				});
				
				element.bind('shutterOpen',function(){
					
					if(animating) return false;
					animating = true;
					
					var count = frames.num-1;
					
					(function animate(){
						if(count<0){
							
							var hide = function(){
								animating=false;
								// Calling the user supplied callback:
								options.openCallback.call(element);
							};
							
							if(options.hideWhenOpened){
								animationHolder.fadeOut(60,hide);
							}
							else{
								hide();
							}
							
							return false;
						}
						
						film.css('top',-frames.height*count - animation.offsetTop);
						count--;
						
						setTimeout(animate,20);
					})();
				});

				// Writing the timing information if the
				// firebug/web development console is opened:
				
				window.console && console.timeEnd && console.timeEnd("Generating Frames");
				options.loadCompleteCallback();
			};
			
			img.src = options.imgSrc;
			
		},0);
		
		return element;		
	};
	
})(jQuery);