(function(){ // layar pembuka: kemajuan muat + ketuk untuk mulai
  var P=0, msgs=['Membuka depo Sukamaju…','Memanaskan mesin Cakra…','Memeriksa sinyal…','Menyiapkan rute…'];
  window.__splash={set:function(p,m){P=Math.max(P,p);var f=document.querySelector('#splash .sp-fill'),t=document.querySelector('#splash .sp-train'),g=document.querySelector('#splash .sp-msg');
    if(f)f.style.width=P+'%'; if(t)t.style.left='calc((100% - 46px) * '+(P/100)+')'; if(g&&m)g.textContent=m;}, msgs:msgs};
})();
window.__splash.set(12);
