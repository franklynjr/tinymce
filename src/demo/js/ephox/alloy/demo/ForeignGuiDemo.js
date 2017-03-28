define(
  'ephox.alloy.demo.ForeignGuiDemo',

  [
    'ephox.alloy.api.events.SystemEvents',
    'ephox.alloy.api.system.ForeignGui',
    'ephox.alloy.construct.EventHandler',
    'ephox.alloy.frame.Reader',
    'ephox.alloy.frame.Writer',
    'ephox.katamari.api.Option',
    'ephox.sand.api.PlatformDetection',
    'ephox.sugar.api.dom.Insert',
    'ephox.sugar.api.dom.InsertAll',
    'ephox.sugar.api.events.DomEvent',
    'ephox.sugar.api.node.Element',
    'ephox.sugar.api.node.Elements',
    'ephox.sugar.api.node.Node',
    'ephox.sugar.api.properties.Css',
    'ephox.sugar.api.search.SelectorFind',
    'ephox.sugar.api.view.Height',
    'ephox.sugar.api.view.Width'
  ],

  function (
    SystemEvents, ForeignGui, EventHandler, Reader, Writer, Option, PlatformDetection, Insert, InsertAll, DomEvent, Element, Elements, Node, Css, SelectorFind,
    Height, Width
  ) {

    var resize = function (element, changeX, changeY) {
      document.querySelector('h2').innerHTML = 'resizing';
      var width = Css.getRaw(element, 'width').map(function (w) {
        return parseInt(w, 10);
      }).getOrThunk(function () {
        return Width.get(element);
      });

      var height = Css.getRaw(element, 'height').map(function (h) {
        return parseInt(h, 10);
      }).getOrThunk(function () {
        return Height.get(element);
      });


      Css.set(element, 'width', (width + changeX) + 'px');
      Css.set(element, 'height', (height + changeY) + 'px');
    };

    return function () {
      var ephoxUi = SelectorFind.first('#ephox-ui').getOrDie();
      var platform = PlatformDetection.detect();

      var onNode = function (name) {
        return function (elem) {
          return Node.name(elem) === name ? Option.some(elem) : Option.none();
        };
      };

      var contents = '<div><strong>drag1</strong> and <code>click1</code> and <strong>drag2</strong> ' +
        'and <code>click2</code> and <img style="width: 140px; height: 130px;" /></div>';

      var frame = Element.fromTag('iframe');
      Css.set(frame, 'min-width', '80%');
      var onload = DomEvent.bind(frame, 'load', function () {
        onload.unbind();
        Writer.write(
          frame, 
          '<html>' + 
            '<head>' +
              '<style>' + 
                '.selected { color: white; background: black; }' +
                '* { font-size: bigger; }\n' + 
                'span { padding: 30px; display: inline-block; border: 1px solid blue; }' + 
              '</style>' + 
            '</head>' +
            '<body>' +
              contents +
            '</body>' +
          '</html>'        
        );
        var root = Element.fromDom(Reader.doc(frame).dom().documentElement);
        addAsForeign(root, function (gui) {
          Insert.append(root, gui.element());
        });
      });

      var inlineContainer = Element.fromHtml(
        contents
      );

      

      var addAsForeign = function (root, doInsert) {
        var connection =  ForeignGui.engage({
          root: root,
          dispatchers: [
            {
              getTarget: onNode('code'),
              alloyConfig: {
                behaviours: {
                  toggling: {
                    toggleClass: 'selected'
                  }
                },

                events: {
                  click: EventHandler.nu({
                    run: function (component, simulatedEvent) {
                      // We have to remove the proxy first, because we are during a proxied event (click)
                      connection.unproxy(component);
                      connection.dispatchTo(SystemEvents.execute(), simulatedEvent.event());
                    }
                  })
                }
              }
            },
            {
              getTarget: onNode('strong'),
              alloyConfig: {
                behaviours: {
                  dragging: platform.deviceType.isTouch() ? {
                    mode: 'touch'
                  } : {
                    mode: 'mouse',
                    blockerClass: 'blocker'
                  }
                }
              }
            },

            {
              getTarget: onNode('img'),
              alloyConfig: {
                behaviours: {
                  pinching: {
                    onPinch: resize,
                    onPunch: resize
                  }
                }
              }
            }
          ]
        });

        return connection;
      };

      InsertAll.append(ephoxUi, 
        Elements.fromHtml(
          '<p>This is a demo for alloy delegation. The iframe and the div editor are not alloy components' +
            ' but they need to exhibit alloy behaviours. This is done through ForeignGui</p>' +
          '<p>Drag the <strong>dragx</strong> elements and click on the <code>clickx</code> elements</p>'
        )
      );

      Insert.append(ephoxUi, Element.fromHtml('<h3>IFrame Editor</h3>'));
      Insert.append(ephoxUi, frame);
      Insert.append(ephoxUi, Element.fromHtml('<h3>Div Editor</h3>'));
      Insert.append(ephoxUi, inlineContainer);


      addAsForeign(inlineContainer, function (gui) {
        Insert.after(inlineContainer, gui.element());
      });
    };
  }
);