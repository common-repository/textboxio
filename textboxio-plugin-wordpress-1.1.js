(function () {
  if (this.ephox)
    var old = this.ephox.bolt;

var defs = {}; // id -> {dependencies, definition, instance (possibly undefined)}

var register = function (id) {
  var module = dem(id);
  var fragments = id.split('.');
  var target = Function('return this;')();
  for (var i = 0; i < fragments.length - 1; ++i) {
    if (target[fragments[i]] === undefined)
      target[fragments[i]] = {};
    target = target[fragments[i]];
  }
  target[fragments[fragments.length - 1]] = module;
};

var instantiate = function (id) {
  var dependencies = defs[id].dependencies;
  var definition = defs[id].definition;
  var instances = [];
  for (var i = 0; i < dependencies.length; ++i)
    instances.push(dem(dependencies[i]));
  defs[id].instance = definition.apply(null, instances);
  if (defs[id] === undefined)
     throw 'required module [' + id + '] could not be defined (definition function returned undefined)';
};

var def = function (id, dependencies, definition) {
  if (typeof id !== 'string')
    throw 'invalid module definition, module id must be defined and be a string';
  if (dependencies === undefined)
    throw 'invalid module definition, dependencies must be specified';
  if (definition === undefined)
    throw 'invalid module definition, definition function must be specified';
  defs[id] = {
    dependencies: dependencies,
    definition: definition,
    instance: undefined
  };
};

var dem = function (id) {
  if (defs[id] === undefined)
    throw 'required module [' + id + '] is not defined';
  if (defs[id].instance === undefined)
    instantiate(id);
  return defs[id].instance;
};

var req = function (ids, callback) {
  var instances = [];
  for (var i = 0; i < ids.length; ++i)
    instances.push(dem(ids[i]));
  callback.apply(null, callback);
};

var ephox = this.ephox || {};

ephox.bolt = {
  module: {
    api: {
      define: def,
      require: req,
      demand: dem
    }
  }
};


/*jsc
["ephox.stamp.api.Main","ephox.wrap.JQuery","ephox.stamp.alien.Patcher","ephox.stamp.api.Plugin","global!textboxio","global!window","ephox.stamp.alien.Wordpress","ephox.stamp.component.Links","ephox.stamp.component.ReadMore","ephox.compass.Arr","global!Array","global!String"]
jsc*/

(function (define, require, demand) {
define(

  'ephox.wrap.JQuery',

  [

  ],

  function () {
    return jQuery;
  }
);
})(ephox.bolt.module.api.define, ephox.bolt.module.api.require, ephox.bolt.module.api.demand);


(function (define, require, demand) {
define(
  'ephox.stamp.alien.Patcher',

  [
  ],

  function () {
    var patch = function (predicate, rate, change) {
      var patcher = setInterval(function () {
        if (predicate()) {
          clearInterval(patcher);
          change();
        }
      }, rate);
    };

    return {
      patch: patch
    };
  }
);

})(ephox.bolt.module.api.define, ephox.bolt.module.api.require, ephox.bolt.module.api.demand);


ephox.bolt.module.api.define("global!window", [], function () { return window; });
(function (define, require, demand) {
define(
  'ephox.stamp.alien.Wordpress',

  [
    'ephox.wrap.JQuery',
    'global!window'
  ],

  function ($, window) {
    var insertMedia = function (id, success) {
      window.send_to_editor = function (html) {
        success(html);
        delete window.send_to_editor;
      };
      window.wp.media.editor.open(id);
    };

    var search = function (term, success) {
      $.ajax({
          type: 'POST',
          url: window.ajaxurl,
          data: {
              action: 'ephox_getlinks',
              page: '1',
              _ajax_linking_nonce: $('#_ajax_linking_nonce').val(),
              search: term
          },
          dataType: 'json'

      }).done(success);
    };

    return {
      insertMedia: insertMedia,
      search: search
    };
  }
);

})(ephox.bolt.module.api.define, ephox.bolt.module.api.require, ephox.bolt.module.api.demand);


ephox.bolt.module.api.define("global!Array", [], function () { return Array; });

ephox.bolt.module.api.define("global!String", [], function () { return String; });
(function (define, require, demand) {
define(
  'ephox.compass.Arr',

  [
    'global!Array',
    'global!String'
  ],

  function (Array, String) {
    var eqC = function(x) {
      return function(y) {
        return x === y;
      };
    };

    var isTrue = eqC(true);

    var contains = function(xs, x) {
      return exists(xs, eqC(x));
    };

    var map = function(xs, f) {
      var r = [];
      for (var i = 0; i < xs.length; i++) {
        var x = xs[i];
        r.push(f(x, i, xs));
      }
      return r;
    };

    var each = function(xs, f) {
      for (var i = 0; i < xs.length; i++) {
        var x = xs[i];
        f(x, i, xs);
      }
    };

    var filter = function(xs, pred) {
      var r = [];
      for (var i = 0; i < xs.length; i++) {
        var x = xs[i];
        if (pred(x, i, xs)) {
          r.push(x);
        }
      }
      return r;
    };

    var indexOf = function(xs, x) {
      if (arguments.length !== 2)
        throw 'Expected 2 arguments to indexOf';
      return findIndex(xs, eqC(x));
    };

    var foldr = function (xs, f, acc) {
      return foldl(reverse(xs), f, acc);
    };

    var foldl = function (xs, f, acc) {
      each(xs, function (x) {
        acc = f(acc, x);
      });
      return acc;
    };

    var find = function(xs, pred) {
      if (arguments.length !== 2)
        throw 'Expected 2 arguments to find';
      for (var i = 0; i < xs.length; i++) {
        var x = xs[i];
        if (pred(x, i, xs)) {
          return x;
        }
      }
      return undefined;
    };

    var findOr = function (xs, f, default_) {
      var r = find(xs, f);
      return r !== undefined ? r : default_;
    };

    var findOrDie = function (xs, f, message) {
      var r = find(xs, f);
      if (r === undefined)
        throw message || 'Could not find element in array: ' + String(xs);
      return r;
    };

    var findIndex = function (xs, pred) {
      var fn = pred || isTrue;

      for (var i = 0; i < xs.length; ++i)
        if (fn(xs[i]) === true)
          return i;

      return -1;
    };

    var flatten = function (xs) {
      var r = [];
      for (var i = 0; i < xs.length; ++i)
        r = r.concat(xs[i]);
      return r;
    };

    var bind = function (xs, f) {
      var output = map(xs, f);
      return flatten(output);
    };

    var forall = function (xs, pred) {
      var fn = pred || isTrue;
      for (var i = 0; i < xs.length; ++i)
        if (fn(xs[i], i) !== true)
          return false;
      return true;
    };

    var exists = function (xs, pred) {
      var fn = pred || isTrue;
      for (var i = 0; i < xs.length; ++i)
        if (fn(xs[i]) === true)
          return true;
      return false;
    };

    var equal = function (a1, a2) {
      return a1.length === a2.length && forall(a1, function (x, i) {
        return x === a2[i];
      });
    };

    var reverse = function (xs) {
      var r = Array.prototype.slice.call(xs, 0);
      r.reverse();
      return r;
    };

    var difference = function (a1, a2) {
      return filter(a1, function (x) {
        return !contains(a2, x);
      });
    };

    var mapToObject = function(xs, f) {
      var r = {};
      each(xs, function(x, i) {
        r[String(x)] = f(x, i);
      });
      return r;
    };

    return {
      map: map,
      each: each,
      filter: filter,
      indexOf: indexOf,
      foldr: foldr,
      foldl: foldl,
      find: find,
      findIndex: findIndex,
      findOr: findOr,
      findOrDie: findOrDie,
      flatten: flatten,
      bind: bind,
      forall: forall,
      exists: exists,
      contains: contains,
      equal: equal,
      reverse: reverse,
      difference: difference,
      mapToObject: mapToObject
    };
  }
);

})(ephox.bolt.module.api.define, ephox.bolt.module.api.require, ephox.bolt.module.api.demand);

(function (define, require, demand) {
define(
  'ephox.stamp.component.Links',

  [
    'ephox.wrap.JQuery',
    'ephox.compass.Arr',
    'ephox.stamp.alien.Wordpress'
  ],

  function ($, Arr, Wordpress) {
    return function (editor, button) {
      var ul = $('<ul/>').addClass('pages');

      var searchbar = $('<input/>').attr({
        type: 'text',
        name: 'page-links-search',
        placeholder: 'Search'
      }).addClass('search-bar');

      searchbar.bind('input', function () {
        clear();
        fetch(searchbar.val());
      });

      var searchlist = $('<div class="ephox-polish-palette-container"></div>');
      searchlist.append(searchbar);
      searchlist.append(ul);
      var popup = editor.content.createPopup(searchlist[0]);

      ul.on('click', 'li', function (event) {
        // Note: The user may have clicked on a child of the li
        var target = $(event.target).closest('li');
        var text = ['<a href="', target.data('permalink'), '">', target.data('title'), '</a>'].join('');
        editor.content.insertHtmlAtCursor(text);
        popup.close();
      });

      var show = function () {
        clear();
        open();
      };

      var clear = function () {
        ul.empty();
      };

      var fetch = function (term) {
        Wordpress.search(term, render);
      };

      var open = function () {
        popup.anchorToElement(button.element());
        popup.open();
      };

      var render = function (links) {
        ul.empty();
        Arr.each(links, function (item) {
          var title = item.title === '' ? '(no title)' : item.title;
          var li = $('<li/>').html('<span class="title">' + item.title + '</span><span class="last-modified">' + item.info + '</span>');
          li.data({
            permalink: item.permalink,
            title: title
          });
          ul.append(li);
        });
      };

      return {
        show: show,
        fetch: fetch
      };
    };
  }
);

})(ephox.bolt.module.api.define, ephox.bolt.module.api.require, ephox.bolt.module.api.demand);


(function (define, require, demand) {
define(
  'ephox.stamp.component.ReadMore',

  [
    'ephox.wrap.JQuery',
    'ephox.compass.Arr'
  ],

  function ($, Arr) {
    var READ_MORE = '<br><div class="tbio-wp-readmore" style="width:100%; border: 1px dashed blue;">Read More</div>';

    var insertAtCursor = function (editor) {
      var doc = editor.content.documentElement();
      editor.content.insertHtmlAtCursor(READ_MORE);
      var readmore = $(doc).find('.tbio-wp-readmore');
      $(readmore).attr('contenteditable', 'false');
      $(readmore).after('<div><br></div>');
    };

    var input = function (elements) {
      Arr.each(elements, function (element) {
        if (element.textContent === 'more') {
          $(element).after(READ_MORE);
          $(element).remove();
        }
      });
    };

    var output = function (elements) {
      Arr.each(elements, function (element) {
        $(element).after(document.createComment('more'));
        $(element).remove();
      });
    };

    return {
      insertAtCursor: insertAtCursor,
      input: input,
      output: output
    };
  }
);

})(ephox.bolt.module.api.define, ephox.bolt.module.api.require, ephox.bolt.module.api.demand);

(function (define, require, demand) {
define(
  'ephox.stamp.api.Plugin',

  [
    'ephox.stamp.alien.Wordpress',
    'ephox.stamp.component.Links',
    'ephox.stamp.component.ReadMore'
  ],

  function (Wordpress, Links, ReadMore) {
    var initialize = function (editor) {

      var tab = editor.toolbar.getTabByName('Attachment');
      tab.removeButton('attach');

      var readMore = editor.toolbar.createButton('Read More', false, 'ephox-polish-icon icon-wordpress-read-more');
      var insertMedia = editor.toolbar.createButton('Insert Media', false, 'ephox-polish-icon icon-wordpress-images');
      var insertLink = editor.toolbar.createButton('Insert Wordpress Page link', false, 'ephox-polish-icon icon-wordpress-link');
      var links = Links(editor, insertLink);

      tab.addButton(readMore);
      tab.addButton(insertMedia);
      tab.addButton(insertLink);

      readMore.events.click.addListener(function () {
        ReadMore.insertAtCursor(editor);
      });

      insertMedia.events.click.addListener(function () {
        Wordpress.insertMedia('content', function (html) {
          editor.content.insertHtmlAtCursor(html);
        });
      });

      insertLink.events.click.addListener(function () {
        links.show();
        links.fetch();
      });

      var comments = function (element) {
        return element.nodeType === 8 || element.nodeName === '#comment';
      };

      editor.filters.predicate.addInput(comments, ReadMore.input);
      editor.filters.selector.addOutput('.tbio-wp-readmore', ReadMore.output);
      editor.content.set(editor.content.get());
    };

    return {
      initialize: initialize
    };
  }
);

})(ephox.bolt.module.api.define, ephox.bolt.module.api.require, ephox.bolt.module.api.demand);


ephox.bolt.module.api.define("global!textboxio", [], function () { return textboxio; });
(function (define, require, demand) {
define(
  'ephox.stamp.api.Main',

  [
    'ephox.wrap.JQuery',
    'ephox.stamp.alien.Patcher',
    'ephox.stamp.api.Plugin',
    'global!textboxio',
    'global!window'
  ],

  function ($, Patcher, Plugin, textboxio, window) {
    return function () {
      textboxio.definePlugin('textbox.wordpress', Plugin);

      var allEditors = {};

      var getMode = function (id, mode) {
        var editor = allEditors[id];
        return mode && mode !== 'toggle' ? mode : editor && editor.element().dom().style.display !== 'none' ? 'html' : 'textbox';
      };

      /* Heavily adapted from the editor.js supplied with Wordpress. */
      var switchTo = function (_id, _mode) {
        var id = _id || 'content';
        var mode = getMode(id, _mode);

        var switcher = mode === 'textbox' ? showTextbox : hideTextbox;
        switcher(id);
      };

      var showTextbox = function (id) {
        var textArea = $(getContainer(id)).find('textarea');
        textArea.css('height', '400px');
        var textAreaId = '#' + textArea.attr('id');

        var instance = textboxio.replace(textAreaId, {
          plugins: ['textbox.wordpress'],
          integration: {
            type: 'wordpress',
            version: '1.1'
          },
          content: {
            highlighters: [
              {
                prefix: '[',
                suffix: ']',
                style: {
                  'color': '#FFF',
                  'background-color': '#8080FF'
                }
              }
            ]
          }
        });

        /* Assumption, by ID there should only ever be one (that matters) */
        allEditors[id] = instance[0];

        etcChanges(true);
      };

      var hideTextbox = function (id) {
        var textArea = $(getContainer(id)).find('textarea').attr('id');
        var textAreaId = '#' + textArea;

        textboxio.remove(textAreaId);
        etcChanges(false);
      };

      var etcChanges = function (tbOn) {
        var edCont     = $('#wp-content-editor-container');
        var postscript = $('#post-status-info');

        if (tbOn) {
          edCont.css({'padding-top': '3px', 'border-radius': ''});
          postscript.hide();
        } else {
          edCont.attr('style', '');
          postscript.show();
        }
      };

      var getContainer = function (id) {
        return document.getElementById('wp-' + id + '-wrap');
      };

      Patcher.patch(function () {
        return window.doPreview;
      }, 100, function () {
        var old = window.doPreview;
        window.doPreview = function () {
          var textarea = document.getElementById('content');
          textarea.innerHTML = allEditors['content'] ? allEditors['content'].content.get() : '';
          old.apply(window, arguments);
        };
      });

      $(document).ready(function () {
        /*
          The default WordPress editor (tinyMCE) creates a hidden <a> tag inside its toolbar which when
          it gets focus, switches the focus to the body of the tinyMCE instance. This hidden <a> tag is
          given focus by pressing tab (or actually releasing tab) in the title field.

          I'm not sure whether we need to prevent the default here, but they do.
        */
        $('#title').on('keydown', function (evt) {
          if (evt.which === 9 && !evt.shiftKey) {
            var editor = allEditors['content'];
            if (editor) {
              editor.focus();
            }
          }
        });
      });

      var init = function (id) {
        showTextbox(id);
      };

      window.StampEditors = {
        switchTo: switchTo,
        init: init
      };
    };
  }
);

})(ephox.bolt.module.api.define, ephox.bolt.module.api.require, ephox.bolt.module.api.demand);


dem("ephox.stamp.api.Main")();
  if (this.ephox)
    this.ephox.bolt = old;
})();
