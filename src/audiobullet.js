(function($){

	"use strict";

	/*
	 *	Constructor function
	 *  event:  bulletAdded, beforeBulletAdded, bulletRemoved, beforeBulletRemoved
	 */


	function AudioBullet(element) {

		this.bulletArray = [];

		this.music = element;
		this.$element = $(element);
		this.player = new AudioPlayer(element);

		this.build();



	}


	AudioBullet.prototype = {


		build: function() {

		},

		add: function(obj) {

			var currentTime = this.music.currentTime;
			var o = {};
			o.timestamp = currentTime;
			o.text = obj;
			this.$element.trigger('beforeBulletAdded', [o]);
			this.bulletArray.push(o);
			this.$element.trigger('bulletAdded', [o, this.bulletArray]);
			console.log(this.bulletArray);
			return o;

		},

		remove: function(obj) {

		},

		// return bullet array
		bullets: function() {

			return this.bulletArray;

		},

		config: function() {

		}



	}



	function AudioPlayer(element) {

		var _this = this;

		this.music = element;
		this.duration = 0; // get it later
		this.$element = $(element);
		this.$container = $('<div class="audanmaku-player"></div>');

		this.$playBtn = null;
		this.$timeline = null;
		this.$runner = null;
		this.timelineWidth = 0;

		this.isMoving = false;

		this.build();

		// get duration
		this.$element.on('canplaythrough', function(){
			_this.duration = _this.music.duration;
		})


	}

	/*
	 *	player prototype function
	 *	event: audio:moveRunner, audio:timeUpdate, audio:clickLine, audio:play, audio:pause
	 */	
	AudioPlayer.prototype = {

		constructor: AudioPlayer,

		build: function() {

			// build player widget
			this.buildWidget(); 
			// register event
			this.registerEvent();
		},

		buildWidget: function() {
			this.$playBtn = $('<button class="play-btn play"></button>');
			this.$timeline = $('<div class="play-timeline">');
			this.$runner = $('<div class="play-runner"></div>');

			this.$timeline.html(this.$runner);
			this.$container.append(this.$playBtn).append(this.$timeline);
			this.$element.after(this.$container);
			this.$container.append(this.$element);

			this.timelineWidth = this.$timeline.width() - this.$runner.width();

		},

		moveRunner: function(e) {
			var _this = this;
			var newMargLeft = e.pageX - _this.$timeline.offset().left;

			_this.$element.trigger('audio:moveRunner', [{currentTime: _this.music.currentTime, offset: newMargLeft}]);

			if (newMargLeft >= 0 && newMargLeft <= _this.timelineWidth) {
				_this.$runner.css('margin-left', newMargLeft + "px");
			}
			if (newMargLeft < 0) {
				_this.$runner.css('margin-left', 0);
			}
			if (newMargLeft > _this.timelineWidth) {
				_this.$runner.css('margin-left', _this.timelineWidth + "px");
			}
		},

		timeUpdate: function() {
			var _this = this;
			// trigger jquery event
			_this.$element.trigger('audio:timeUpdate', [{currentTime: _this.music.currentTime}]);

			var playPercent = _this.timelineWidth * (_this.music.currentTime / _this.duration);
			_this.$runner.css('margin-left', playPercent + 'px');
			if (_this.music.currentTime == _this.duration) {
				//pause
				_this.pause();
			}
		},
		mouseDown: function() {
			var _this = this;
			_this.isMoving = true;
			_this.$container.on('mousemove', _this.moveRunner.bind(_this));
			_this.$element.off('timeupdate'); //temperory remove update effect
		},

		mouseUp: function(e) {

			var _this = this;
			if (_this.isMoving == true) {
				_this.moveRunner.call(_this, e);
				_this.$container.off('mousemove');
				// change current time
				_this.music.currentTime = _this.duration * _this.clickPercent.call(_this, e);
				_this.$element.on('timeupdate', _this.timeUpdate.bind(_this));
			}
			_this.isMoving = false;
		},


		clickPercent: function(e) {
			var _this = this;
			return (e.pageX - _this.$timeline.offset().left) / _this.timelineWidth;
		},

		registerEvent: function() {

			var _this = this;

			_this.$playBtn.on('click', _this.togglePlay.bind(_this));

			_this.$element.on('timeupdate', _this.timeUpdate.bind(_this));

			_this.$timeline.on('click', function(e) {
				_this.$element.trigger('audio:clickLine');
				_this.moveRunner.call(_this, e);
				_this.music.currentTime = _this.duration * _this.clickPercent.call(_this, e);				
			});

			_this.$runner.on('mousedown', _this.mouseDown.bind(_this));
			$(window).on('mouseup', _this.mouseUp.bind(_this));

		},


		togglePlay: function() {
			var _this = this;
			if (_this.music.paused) {
				_this.play();
			} else { // pause music
				_this.pause();
			}
		},

		play: function() {
			var _this = this;
			_this.$element.trigger('audio:play', [{currentTime: _this.music.currentTime}]);
			_this.music.play();
			// remove play, add pause
			_this.$playBtn.removeClass('play').addClass('pause');
		},

		pause: function() {
			var _this = this;
			_this.$element.trigger('audio:pause', [{currentTime: _this.music.currentTime}]);
			_this.music.pause();
			// remove pause, add play
			_this.$playBtn.removeClass('pause').addClass('play');
			
		},

		reset: function() {

		},

		replay: function() {
			var _this = this;
			_this.reset();
			_this.play();
		}

	}

	$.fn.audiobullet = function(arg1, arg2, arg3) {

		var results = [];

		this.each(function(){

			var audiobullet = $(this).data('audiobullet');

			if (!audiobullet) {
				console.log('init');
				audiobullet = new AudioBullet(this);
				//add flag
				$(this).data('audiobullet', audiobullet);
				results.push(audiobullet);

			} else if (!arg2 && !arg3) {
				console.log('one arg');
				//return value or config
				if (typeof arg1 == 'string') {
					
					results.push(audiobullet[arg1]());

				} else if (typeof arg1 == 'object') {

					audiobullet.config(arg1);
					results.push(audiobullet);

				} 

			} else {
				console.log('two args');
				//operation
				var retVal = audiobullet[arg1](arg2, arg3);
				if (retVal) results.push(retVal);
			}

		});

		if (arguments.length <= 1)
			return results.length > 1 ? results : results[0];
		else
			return results;
	}


	$('.audio-bullet').audiobullet();

})(window.jQuery);


