ClientRouter.prototype.layout = 'transitionerPanes';

Transitioner = {
  // by default, listen to the singleton router, override to not (e.g. tests)
  router: Router,
  _transitionEvents: 'webkitTransitionEnd.transitioner oTransitionEnd.transitioner transitionEnd.transitioner msTransitionEnd.transitioner transitionend.transitioner',
  transitioning: false,
  
  attach: function(template) {
    var oldPartial, oldPath, self = this;
    
    self.container = template.find('.transitioner-panes');
    self.leftPane = template.find('.left-pane');
    self.rightPane = template.find('.right-pane');
    
    Deps.autorun(function() {
      var newPartial = self.router._partials.get();
      var newPath = self.router.current().path;
      
      if (! oldPartial || oldPath !== newPath || newPartial.template != oldPartial.template) {
        self.transitionStart();
      } else {
        var currentPane = self.reverse ? self.leftPane : self.rightPane;
        
        self.clearPane(currentPane);
        self.renderToPane(currentPane);
      }
      
      oldPartial = newPartial;
      oldPath = newPath;
    });
  },
  
  transitionStart: function() {
    var self = this;
    
    // kill exisiting transition
    self.transitioning && self.transitionEnd();
    self.transitioning = true;
    
    if (! self.reverse) {
      self.renderToNextPane(self.leftPane);
      self.reverse = true;
    } else {
      self.renderToNextPane(self.rightPane);
      self.reverse = false;
    }
    
    self.container.offsetWidth; // force a redraw
    
    $(self.container).addClass('transitioning')
      .on(self._transitionEvents, function(e) {
        if (! $(e.target).is(self.container))
          return;
        
        self.transitionEnd();
      });
  },
  
  transitionEnd: function() {
    var self = this;
    
    // switch classes around
    if (self.currentPage) {
      $(self.currentPage).removeClass('current-page');
      
      self.clearPane(self.currentPage);
    }
    
    self.currentPage = self.nextPage;
    $(self.currentPage).removeClass('next-page').addClass('current-page');
    
    // finish.
    $(self.container).removeClass('transitioning')
      .off(self._transitionEvents);
    
    self.transitioning = false;
  },
  
  clearPane: function(pane) {
    // XXX: remove this properly, making sure bindings work correctly
    pane.innerHTML = '';
  },
  
  renderToPane: function(pane) {
    var self = this;
    
    pane.appendChild(Meteor.render(function() {
      // render the current page to the current pane
      return self.router._partials.get().render();
    }));
  },
  
  renderToNextPane: function(pane) {
    this.renderToPane(pane);
    this.nextPage = pane;
    $(pane).addClass('next-page');
  }
}

Template.transitionerPanes.rendered = function() {
  if (! this.attached) {
    this.attached = true;
    Transitioner.attach(this);
  }
}