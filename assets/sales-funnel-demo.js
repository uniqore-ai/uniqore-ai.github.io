(function(){
  'use strict';

  function init(root){
    if (!root || root.dataset.demoReady === 'true') return;
    root.dataset.demoReady = 'true';

    var leak = root.querySelector('[data-demo-leak]');
    var chat = root.querySelector('[data-demo-chat]');
    var sourceBlock = root.querySelector('[data-demo-source-block]');
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function copy(key){
      var node = root.querySelector('[data-demo-copy="' + key + '"]');
      return node ? node.textContent.trim() : '';
    }

    function animateBars(scope){
      scope.querySelectorAll('[data-demo-width]').forEach(function(bar){
        bar.style.width = bar.dataset.demoWidth + '%';
      });
    }

    function countLeak(){
      if (!leak || leak.dataset.counted === 'true') return;
      leak.dataset.counted = 'true';
      var target = 16300;
      if (reducedMotion) {
        leak.textContent = target.toLocaleString('en-US');
        return;
      }
      var started = null;
      function step(timestamp){
        if (!started) started = timestamp;
        var progress = Math.min((timestamp - started) / 1200, 1);
        leak.textContent = Math.round(target * progress).toLocaleString('en-US');
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function reveal(){
      animateBars(root);
      countLeak();
    }

    if ('IntersectionObserver' in window && !reducedMotion) {
      var observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (!entry.isIntersecting) return;
          reveal();
          observer.unobserve(root);
        });
      },{threshold:.2});
      observer.observe(root);
    } else {
      reveal();
    }

    function push(kind,text,delay){
      window.setTimeout(function(){
        var message = document.createElement('div');
        message.className = 'msg ' + kind;
        message.textContent = text;
        chat.appendChild(message);
        chat.scrollTop = chat.scrollHeight;
      },delay || 0);
    }

    function bind(action,handler){
      var button = root.querySelector('[data-demo-action="' + action + '"]');
      if (button) button.addEventListener('click',function(){ handler(button); });
    }

    bind('source',function(button){
      button.disabled = true;
      button.textContent = copy('sourceButtonDone');
      push('user',copy('sourceUser'));
      window.setTimeout(function(){
        sourceBlock.hidden = false;
        animateBars(sourceBlock);
      },350);
      push('agent',copy('sourceAgent'),500);
    });

    bind('why',function(button){
      button.disabled = true;
      push('user',copy('whyUser'));
      push('agent',copy('whyAgent'),450);
    });

    bind('monday',function(button){
      button.disabled = true;
      push('user',copy('mondayUser'));
      push('agent',copy('mondayAgent'),400);
    });
  }

  document.querySelectorAll('[data-sales-funnel-demo]').forEach(init);
})();
