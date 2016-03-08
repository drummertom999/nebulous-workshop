// *******************************************
//# sourceURL=modules/enginejs-audio.js
// *******************************************

Engine.Audio =
{
	LoadSound : function(descriptor, callback)
	{
		Engine.Net.FetchBinaryResource(descriptor.file, function(encoded_audio)
		{
			Engine.Audio.context.decodeAudioData(encoded_audio, function(buffer)
			{
				var sound_object =
				{
					url        : descriptor.file,
					pcm_buffer : buffer
				}
				callback(sound_object);
			});
		});
	},

	PlaySFX : function(sound_object)
	{
		// This is just a helper method, intended for use when the user wants
		// to fire-and-forget sounds without holding on to the sound effect instance
		var sfx = new Engine.Audio.SoundEffect2D(sound_object);
		sfx.Play();
	},

	Sound : function(sound_object, global_volume_node, loop)
	{
		this.resource = sound_object;
		this.loop = loop;

		// Let this instance have it's own volume range, starting at
		// full volume and clamped to global SFX volume
		this.volume_node = Engine.Audio.context.createGain();
		this.volume_node.gain.value = 1.0;
		this.volume_node.connect(global_volume_node);

		// Playback control
		this.playback_state = "stopped";
		this.play_timestamp = 0;
		this.play_position = 0;

		this.ResetSoundSource = function(loop)
		{
			// NOTE: Always have to do this before calling play()
			// as play() can only be called once per buffer source instance
			if(this.source && this.playback_state == "playing")
			{
				this.source.noteOff? this.source.noteOff(0) :
				                     this.source.stop();
			}

			// Re-create buffer from existing properties
			this.source = Engine.Audio.context.createBufferSource();
			this.source.buffer = this.resource.pcm_buffer;
			this.source.loop = this.loop;
			this.source.connect(this.volume_node);
		},

		this.Play = function()
		{
			// Early out if this instance is already playing
			if(this.playback_state == "playing") { return; }

			// Store off timestamp and play / resume
			this.play_timestamp = Engine.Time.Now();
			this.source.noteOn? this.source.noteOn(0) :
			                    this.source.start(0, (this.playback_state == "stopped") ? 0 : this.play_position);
			this.playback_state = "playing";
		};

		this.Pause = function()
		{
			// Early out if this instance is not playing
			if(this.playback_state != "playing") { return; }

			// Store off play position for resuming later
			this.play_position += ((Engine.Time.Now() - this.play_timestamp) / 1000);
			this.play_position %= this.source.buffer.duration; // Handle looping

			// Stop playback
			this.ResetSoundSource();
			this.playback_state = "paused";
		};

		this.Stop = function()
		{
			this.ResetSoundSource();
			this.play_position = 0;
			this.playback_state = "stopped"
		};

		this.Restart = function()
		{
			this.Stop();
			this.Play();
		};

		// Volume controls
		this.GetVolume = function() { return this.volume_node.gain.value; };
		this.SetVolume = function(volume) { this.volume_node.gain.value = volume; };

		// Loop controls
		this.IsLooped = function() { return this.loop; };
		this.EnableLoop = function(loop) { this.loop = loop; };

		// First-time source setup
		this.ResetSoundSource(loop);
	},

	SoundEffect2D : function(sound_object)
	{
		// Inherit base
		$.extend(this, new Engine.Audio.Sound(sound_object, Engine.Audio.volume_nodes["sfx"], false));
	},

	BackgroundMusic : function(sound_object)
	{
		// Inherit base
		$.extend(this, new Engine.Audio.Sound(sound_object, Engine.Audio.volume_nodes["bgm"], true));
	},

	SetGlobalBgmVolume : function(volume)
	{
		Engine.Audio.volume_nodes["bgm"].gain.value = volume;
	},

	SetGlobalSfxVolume : function(volume)
	{
		Engine.Audio.volume_nodes["sfx"].gain.value = volume;
	},
};

// *******************************************
// Init
// *******************************************
window.AudioContext = window.AudioContext || window.webkitAudioContext;
Engine.Audio.context = new AudioContext();

// Setup volume nodes
Engine.Audio.volume_nodes =
{
	"bgm" : Engine.Audio.context.createGain(),
	"sfx" : Engine.Audio.context.createGain()
};

// Connect volume nodes to audio output
Engine.Audio.volume_nodes["bgm"].connect(Engine.Audio.context.destination);
Engine.Audio.volume_nodes["sfx"].connect(Engine.Audio.context.destination);

// Register handler for mp3 files
Engine.Resource.RegisterLoadFunction("mp3", Engine.Audio.LoadSound);

// For some mobile devices (including iPhone/iPad), the very first sound
// has to be triggered via touch event to unmute the audio system. This is
// achieved below by playing a blank 100ms mp3 on the very first touch event.
Engine.Touch.OnFirstTouch(function()
{
	var blank_sfx = new Engine.Audio.SoundEffect2D(Engine.Resources["sfx_blank"]);
	blank_sfx.Play();
});