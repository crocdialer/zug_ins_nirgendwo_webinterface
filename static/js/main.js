ControlWidget =
{
  update_url: "http://" + location.host + "/state",
  movie_names: [],
  movie_index: -1,
  components: [],

  init: function()
  {
    console.log("init ControlWidget");

    var self = this;

    $( "#load" ).click(function()
    {
      console.log("load settings");
      $.get("/load");
      self.get_state_and_update();
    });
    $( "#save" ).click(function()
    {
      console.log("save settings");
      $.get("/save");
      self.get_state_and_update();
    });

    $("#movie_delay").change(function()
    {
      console.log("delay changed: " + $(this).val());
      self.set_movie_delay(Number($(this).val()));
    });

    $("#playlist").change(function()
    {
      console.log("playlist changed: " + $(this).val());
      self.set_playlist($(this).val());
    });
  },

  update_ui_with_component: function(the_component)
  {
    this.movie_names = [];
    var self = this;

    $.each(the_component.properties, function(key, prop)
    {
      // list of availbale movies
      if(prop.name == "movie library" && prop.value)
      {
        $.each(prop.value, function(the_index, movie_path)
        {
          var tmp = movie_path.split('/');

          if(tmp.length > 0)
          {
            var str = tmp[tmp.length - 1];
            tmp = str.split('.');

            if(tmp.length > 0){ self.movie_names.push(tmp[0]); }
          }
        });
      }
      else if(prop.name == "movie index")
      {
        self.movie_index = Number(prop.value);
        console.log("current index: " + self.movie_index);
      }
      else if(prop.name == "movie delay")
      {
        console.log(prop.name + " :" + prop.value);
      }
      else if(prop.name == "movie playlist")
      {
        console.log(prop.name + " :" + prop.value);
      }

      // insert remaining values into corresponding DOM elements (if any)
      var dom_sel = "#" + prop.name.trim().replace(/ /g,'_');
      $(dom_sel).val(prop.value);
    });

    // create movie thumbnails
    if(this.movie_names.length)
    {
      var movie_root = $(".movie_root");
      movie_root.empty();

      // create and append DOM elements
      for(var i = 0; i < this.movie_names.length; i++)
      {
        var n = this.movie_names[i];
        var mov_elem =
          $("<div class='jumbotron movie_thumb'/>").append($("<h2/>").html(i + ": " + n));
        movie_root.append(mov_elem);

        if(n == self.movie_index){ mov_elem.addClass("active"); }
      }

      // create click handler
      $(".movie_thumb").click(function()
      {
        var thumb = this;
        var index = -1;

        $(".movie_thumb").each(function(the_index)
        {
          if(thumb == this){ index = the_index; }
          $(this).removeClass("active");
        });
        $(this).addClass("active");

        self.set_movie_index(index);
        //console.log("movie thumb clicked: " + index);
      });
    }
  },

  get_state_and_update: function()
  {
    $("#control_form").empty();
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
    //console.log(the_json_obj);
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

  set_movie_index: function(the_index)
  {
    var prop_name = "movie index";

    // generate json objects
    var json_obj =
    {
      "name" : prop_name,
      "type" : "int",
      "value" : the_index
    };
    this.on_change(json_obj);
  },

  set_movie_delay: function(the_delay)
  {
    var prop_name = "movie delay";

    // generate json objects
    var json_obj =
    {
      "name" : prop_name,
      "type" : "float",
      "value" : the_delay
    };
    this.on_change(json_obj);
  },

  set_playlist: function(the_playlist_str)
  {
    var prop_name = "movie playlist";

    // generate json objects
    var json_obj =
    {
      "name" : prop_name,
      "type" : "string",
      "value" : the_playlist_str
    };
    this.on_change(json_obj);
  }
};

$(document).ready(function(){
  ControlWidget.init();
  ControlWidget.get_state_and_update();
});
