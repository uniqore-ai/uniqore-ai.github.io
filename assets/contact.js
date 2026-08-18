(function(){
  'use strict';

  var whatsappNumber = '77019852754';

  function whatsappUrl(message){
    return 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(message);
  }

  function wireWhatsApp(root){
    (root || document).querySelectorAll('[data-whatsapp-message]').forEach(function(link){
      link.href = whatsappUrl(link.dataset.whatsappMessage || '');
      link.target = '_blank';
      link.rel = 'noopener';
    });
  }

  window.UniqoreContact = {whatsappNumber:whatsappNumber,whatsappUrl:whatsappUrl,wireWhatsApp:wireWhatsApp};
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',function(){ wireWhatsApp(document); });
  else wireWhatsApp(document);
})();
