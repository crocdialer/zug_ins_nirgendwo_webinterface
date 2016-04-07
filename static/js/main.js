ControlWidget =
{
  update_url: "http://" + location.host + "/state",
  data:{},
  movie_index: -1,
  is_playing: true,
  rewind_secs: 5.0,
  components: [],

  init: function()
  {
    console.log("init ControlWidget");
    var self = this;

    $(".remove_me").remove();

    // check for remote application
    this.get_state_and_update();

    // load json data
    $.getJSON("/static/data/data.json", function(data)
    {
      self.data = data;

      // remove initial content
      $("#timetable p").remove();

      for(var i = 0; i < data.length; i++)
      {
        var txt = data[i].start_time + "-" + data[i].end_time;
        $("#timetable").append($("<p/>").html(txt));
      }

      // attach click handlers, when loaded
      $("#timetable p").each(function(the_index)
      {
        $(this).click(function()
        {
          self.jump_to_index(the_index + 1);
          self.send_current_movie_index();
        });
      });

      // play/pause click handler
      $("#play_button").click(function()
      {
        self.toggle_playback();
      });

      $("#loop_button").click(function()
      {
        var anchors = $("#timetable p");
        var playhead = $("#playhead");

        // remove classes
        $(anchors).removeClass("active glow");

        self.jump_to_index(0);
        self.send_current_movie_index();
      });

      self.jump_to_index(0);
      self.send_current_movie_index();
    });
  },
  toggle_playback: function()
  {
    var self = this;

    console.log("toggle_playback " + this.movie_index);
    this.is_playing = !this.is_playing;

    // update icon
    this.update_playback_icon();

    // tell videoplayer to toggle play/pause
    var toggle_url = "http://" + location.host + "/toggle_playback";
    $.get(toggle_url);

    var playhead = $("#playhead");

    if(!this.is_playing)
    {
      // stop
      playhead.stop();
    }
    else if(this.movie_index > 0)
    {
      console.log("resume playback");

      var data_index = this.movie_index - 1;
      var anchors = $("#timetable p");
      var active_anchor = $(anchors[data_index]);

      // resume
      var anim_duration = parseFloat(this.data[data_index]["movie_duration"]) * 1000;
      var start_pos = active_anchor.position().top - playhead.height() / 2;
      var end_pos = start_pos + active_anchor.outerHeight();
      var current_pos = playhead.position().top;

      //rewind playhead
      var top_inc = this.rewind_secs * 1000.0 / anim_duration * active_anchor.outerHeight();
      current_pos = Math.max(start_pos, current_pos - top_inc);
      playhead.css("top", current_pos + "px");

      // value between [0 ... 1] that indicates the current position
      var progress = (current_pos - start_pos) / (active_anchor.outerHeight());
      // console.log(progress);

      var new_duration = (1.0 - progress) * anim_duration;
      // console.log(new_duration);

      playhead.animate({top: end_pos + "px"}, new_duration, "linear", function()
      {
        // completion handler
        self.jump_to_index((self.movie_index + 1) % (self.data.length + 1));
      });
    }
  },
  jump_to_index: function(the_index)
  {
    console.log("jump_to_index: " + the_index);
    var self = this;
    var anchors = $("#timetable p");
    var playhead = $("#playhead");

    // remove classes
    $(anchors).removeClass("active glow");

    var data_index = the_index - 1;

    if(the_index > 0)
    {
      var active_anchor = $(anchors[data_index]);
      active_anchor.addClass("active glow");

      // set playhead and animate
      playhead.show();
      var anim_duration = parseFloat(this.data[data_index]["movie_duration"]) * 1000;
      var y_pos = active_anchor.position().top - playhead.height() / 2;
      playhead.stop();
      playhead.css("top", y_pos + "px");
      var y_dest = y_pos + active_anchor.outerHeight();
      playhead.animate({top: y_dest + "px"}, anim_duration, "linear", function()
      {
        // completion handler
        self.jump_to_index((the_index + 1) % (self.data.length + 1));
      });
    }
    else
    {
      playhead.hide();
      playhead.stop();
    }

    var desc = {};
    if(data_index >= 0){ desc = this.data[data_index].descriptions; }

    this.is_playing = true;

    // set the active movie index
    this.movie_index = the_index;

    // update playback and loop icons
    this.update_playback_icon();

    ////////// update description texts ///////////////

    // list root for our elements
    var dom_list = $(".desc_text ul");

    var fade_duration = 600;

    // fade out
    dom_list.fadeOut(fade_duration, function()
    {
      dom_list.empty();
      var class_names = ["color_01", "color_02", "color_03"];
      for(var i = 0; i < desc.length; i++)
      {
        var keys = [];
        for (var key in desc[i])
        {
          if (desc[i].hasOwnProperty(key)){ keys.push(key); }
        }
        var col_idx = parseInt(keys[0]);

        // create new dom li-element
        var new_li = $("<li/>").addClass(class_names[col_idx]).html(desc[i][keys[0]]);
        dom_list.append(new_li);
      }
      if(the_index > 0){ dom_list.fadeIn(fade_duration); }
    });
  },
  update_playback_icon: function()
  {
    $("#play_button img").attr('src', "static/img/" +
    (this.is_playing ? "pause.png" : "play.png"));

    $("#loop_button img").attr('src', "static/img/" +
    (!this.movie_index ? "loop_active.png" : "loop.png"));
  },
  update_ui_with_component: function(the_component)
  {
    this.movie_names = [];
    var self = this;
  },

  get_state_and_update: function()
  {
    var self = this;

    $.getJSON(this.update_url, function(data)
    {
      self.components = data;
      for(var i = 0; i < data.length; i++)
      {
        self.update_ui_with_component(data[i]);
      }
    });
  },

  on_change: function(the_json_obj)
  {
    if(this.components.length == 0)
    {
       console.warn("no connection to movie player");
       this.get_state_and_update();
       return;
    }
    var component_obj = [{"name" : this.components[0].name, "properties": [the_json_obj]}]

    $.ajax({
    type: "POST",
    url: this.update_url,
    data: JSON.stringify(component_obj),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: null,
    failure: null});
  },

  send_current_movie_index: function()
  {
    var prop_name = "movie index";

    // generate json objects
    var json_obj =
    {
      "name" : prop_name,
      "type" : "int",
      "value" : this.movie_index
    };
    this.on_change(json_obj);
  }
};

$(document).ready(function()
{
  ControlWidget.init();
});
