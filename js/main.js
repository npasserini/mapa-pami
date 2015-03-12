$(function() {

  // cartoDB configuration
  var config = {
    user: 'nicopasserini',
    table: 'actividadesconcentros',
    debug: true
  };

  // add an OpenStreetMap tile layer
  var tileLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  });

   // create a map in the "map" div, set the view to a given place and zoom
  var map = L.map('map', {
    center: [-34.624874, -58.427166],
    zoom: 12,
    layers: tileLayer,
    attributionControl: false
  });

  renderAddresses = function() {
    var filtro = $('#search').val() || '';

    var subtipos = _.map($('.subtipo_check.todo-done'), function(item) {
      return $(item).attr('data-subtipo');
    });

    var cluster = $('li.clusterMarkers div.switch div').hasClass('switch-on');

    map.spin(true);
    fetchLocations(filtro, subtipos, map.getBounds(), config, function(data) {
      map.spin(false);
      map.renderAddresses(data.rows, filtro, cluster);
    });
  }

  map.updateCluster = function() {
    var filtro = $('#search').val() || '';
    var cluster = $('li.clusterMarkers div.switch div').hasClass('switch-on');

    map.spin(true);
    // allow dom to repaint,
    // see http://stackoverflow.com/a/4005365, http://stackoverflow.com/a/12022571
    window.setTimeout(function() {
      map.renderAddresses(map.data, filtro, cluster);
      map.spin(false);
    }, 50);
  };

   // Add a method to my map to render every address
  map.renderAddresses = function(addresses, filtro, cluster) {
    console.log('rendering ' + addresses.length + ' addresses');

    if (map.addresses) map.addresses.clearLayers();
    map.addresses = cluster ? new L.MarkerClusterGroup() : new L.LayerGroup();
    map.addLayer(map.addresses);

    // Save a copy of the data so that I can rerender without reading from the web service
    map.data = addresses;

    var formatUrl = function(url) {
      return url.substr(0, 7) === 'http://' ? url : 'http://' + url;
    };

    var formatUrlText = function(url) {
      return url.substr(0, 7) === 'http://' ? url.substr(7) : url;
    };

    var formatFiltro = function(value, filtro) {
      if (!filtro) return value;
      var regExp = new RegExp('(.*)(' + filtro + ')(.*)', 'ig');
      var matches = regExp.exec(value);
      if (!matches) return value;
      return matches[1] + '<span class="filtro">' + matches[2] + '</span>' + matches[3];
    };

    var nombreProv = function() {
      var provincias = ['Capital Federal', 'Buenos Aires', 'Catamarca', 'Córdoba', 'Corrientes', 'Chaco', 'Chubut', 
        'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 
        'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];

      return function(id) {
        return provincias[id - 1];
      }
    }();

    var locationString = function(address) {
      var fields = ["barrio", "partido", "localidad"], 
        data = _.map(fields, _.propertyOf(address)),
        result = "",
        previous = "";

      data.push(nombreProv(address.provincia));

      data.forEach(function(current) {
        if (current && current.toLowerCase() !== previous.toLowerCase()) {
          if (result) result += ", ";
          result += current;
          previous = current;
        }
      });

      return result;
    }

    var formatMessage = function(activity) {
      /*
        var message =
          '<b>' + (location.tipo ===  'ugl' ?
            'UGL: '     + formatFiltro(location.ugl, filtro) :
            'Agencia: ' + formatFiltro(location.agencia, filtro)
          ) + '</b></br>' +
          (location.direccion ?
            '<b>' + formatFiltro(location.direccion, filtro) + '</b></br>' : ''
          ) +
          (location.telefono ? '<b>Tel</b>: ' + location.telefono + '</br>' : '') +
          (location.fax ? '<b>Fax</b>: ' + location.fax + '</br>' : '') +
          (location.pami_escucha ? '<b>Pami escucha</b>: ' + location.pami_escucha + '</br>' : '') +
          (location.actividades ? '<b>Actividades</b>: ' +
            filtroActividades(location.actividades, actividades) + '</br>' : ''
          ) +
          (location.prestaciones_medicas ? '<b>Prestaciones</b>: ' + location.prestaciones_medicas + '</br>' : '') +
          (location.responsable ? '<b>Responsable</b>: ' + location.responsable + '</br>' : '');
*/
        // if (counter == 1) { console.log(location); }

        //   '<b>' + location.taller + '</b></br>' +
        //   (location.direccion ?
        //     '<b>' + formatFiltro(location.direccion, filtro) + '</b></br>' : ''
        //   ) +
        //   (location.cp ?
        //     '<b>' + location.cp.toString() + '</b></br>' : ''
        //   ) +
        //   (location.telefono ? '<b>Tel</b>: ' + location.telefono + '</br>' : '')
        // ;

      //   'taller, nombre_a, nombre_efector_comunitario, ' +
      // 'calle, numero, piso, dpto, ' +
      // 'barrio, partido, localidad, provincia, ' +
      var title = format("<b>{taller}</b><br/>{nombre_efector_comunitario}", activity);
      var streetAddress = format("{calle} {numero} {piso} {dpto}", activity);

      return format("{0}<br/><br/>{1}<br/>{2}", title, streetAddress, locationString(activity));


      var prop = function(title, value) {
        if (!value) return '';
        return (title ? '<b>' + title + ': </b>' : '') + value + '</br>';
      };

      var direccion = location.direccion +
        (location.cp ? ' (cp ' + location.cp + ')' : '');

      var m =
        prop(location.sub_tipo, location.nombre) +
        prop('', formatFiltro(location.direccion, filtro)) +
        prop('Teléfono', location.telefono) +
        propExtras(location)
      ;

      return m;
    }

/*
banco de protesis =fa-bank, fa-recycle, fa-wheelchair
ugl: hospital
agencia: user-md
boca de atencion: fa-plus-circle
farmacias: fa-medkit
centros de jubilados: fa-building, fa-group, fa-heart, fa-home,

banco de protesis = icon-building
ugl: icon-hospital
agencia: icon-user-md
boca de atencion: icon-plus-sign-alt
farmacias: icon-medkit
centros de jubilados: icon-building, icon-group, icon-heart, icon-home,
*/

    var color,
      defaultColor = 'blue',
      // https://github.com/lvoogdt/Leaflet.awesome-markers
      // 'red', 'darkred', 'orange', 'green', 'darkgreen',
      // 'blue', 'purple', 'darkpuple', 'cadetblue'
      colors = {
        'UGL':                  'cadetblue',
        'Agencia':              'blue',
        'Farmacia':             'purple',
        'Boca de atencion':     'green',
        'Centro de jubilados':  'orange',
        'Banco de protesis':    'darkpurple'
      },
      icon,
      defaultIcon = 'tint',
      icons = {
        'UGL':                  'hospital',
        'Agencia':              'user-md',
        'Farmacia':             'medkit',
        'Boca de atencion':     'plus-sign-alt',
        'Centro de jubilados':  'group',
        'Banco de protesis':    'building'
      };

    // optimize loop -> http://stackoverflow.com/a/1340634/47633
    var location,
      counter = addresses.length,
      markers = [];

    // map.spin(true);
    var markerProperties = {
      icon: L.AwesomeMarkers.icon({
        icon: defaultIcon,
        color: defaultColor
      })
    };

    while (counter--) {
      location = addresses[counter];

      var message = formatMessage(location);
      markers.push(L.marker([location.lat, location.lon], markerProperties).bindPopup(message));
    }
    map.addresses.addLayers(markers);
    
    return this;
  };

  $('#search').on('input', _.debounce(function(e) {
    renderAddresses();
  }, 800));

  $('.clusterMarkers').on('click', function(e) {
    // give time for switch plugin to change the value of the checkbox
    window.setTimeout(function() { map.updateCluster(); }, 100);
  });

  $('.subtipo_check').on('click', function(e) {
    console.log(e.currentTarget);
    $(e.currentTarget).toggleClass('todo-done');
    renderAddresses();
  });

  $(function() {
    renderAddresses();
  });

  map.lastZoom = map.getZoom();
  map.on('moveend', function() {
    // me acerqué, no traigo nuevos puntos
    if (map.getZoom() > map.lastZoom) {
      map.lastZoom = map.getZoom();
      return;
    }
    renderAddresses();
    map.lastZoom = map.getZoom();
  });
});
