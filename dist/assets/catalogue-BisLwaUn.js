import{a as P,S as d,b as w}from"./anime.es-C48xQsAk.js";/* empty css              */let y,T;const D=new Promise(t=>T=t),A=indexedDB.open("mangaDB",1);A.onerror=()=>console.log("Erreur d’ouverture de la base de données");A.onsuccess=t=>{y=t.target.result,T(!0)};A.onupgradeneeded=t=>{y=t.target.result,y.objectStoreNames.contains("mangas")||y.createObjectStore("mangas",{keyPath:"id"})};const x=document.getElementById("anime-cards"),m=document.getElementById("loader"),_=document.getElementById("prev-page"),h=document.getElementById("next-page"),L=document.getElementById("page-current"),C=document.getElementById("page-total"),u=document.getElementById("page-input"),E=document.getElementById("go-page");let l=1,r=null,v=!1;const $=new Map;x&&m&&(f(1),_?.addEventListener("click",()=>{l>1&&f(l-1)}),h?.addEventListener("click",()=>{r&&l<r&&f(l+1)}),E?.addEventListener("click",()=>{const t=Number(u.value);if(!(!Number.isFinite(t)||t<1)){if(r&&t>r){d.fire({icon:"info",title:"Page invalide",text:`La dernière page est ${r}.`});return}f(t)}}),u?.addEventListener("keydown",t=>{t.key==="Enter"&&E?.click()}));async function f(t){if(!v){v=!0,m.style.display="block",m.textContent="Chargement...",x.innerHTML="",S(!0);try{const n=await P.get("https://api.jikan.moe/v4/anime",{params:{page:t,limit:25}}),e=n.data.data,s=n.data.pagination;l=s?.current_page??t,r=s?.last_visible_page??r,m.style.display="none",L&&(L.textContent=String(l)),C&&(C.textContent=r?String(r):"?"),u&&(u.value=""),M(e),S(!1),H(),window.scrollTo({top:0,behavior:"smooth"})}catch(n){console.error(n),m.style.display="none",S(!1),d.fire({icon:"error",title:"Erreur API",text:"Impossible de charger cette page pour le moment."})}finally{v=!1}}}function S(t){[_,h,E].forEach(n=>{n&&(n.disabled=t)}),u&&(u.disabled=t)}function H(){_&&(_.disabled=l<=1),h&&r&&(h.disabled=l>=r)}function M(t){const n=[];t.forEach(e=>{const s=document.createElement("div");s.classList.add("anime-card");const i=e.synopsis?String(e.synopsis).replace(/\s+/g," ").trim():"Synopsis indisponible";s.innerHTML=`
      <img src="${e.images?.jpg?.image_url||""}" alt="${g(e.title)}">
      <h3>${a(e.title)}</h3>

      <div class="actions">
        <button class="add-to-db">Ajouter à ma bibliothèque</button>

        <button class="details-button"
          data-id="${e.mal_id}"
          data-title="${g(e.title)}"
          data-synopsis="${g(i)}"
        >Détails</button>

        <button class="desc-button"
          data-title="${g(e.title)}"
          data-synopsis="${g(i)}"
        >Voir Description</button>
      </div>
    `,s.querySelector(".add-to-db").addEventListener("click",async()=>{await N(e)}),s.querySelector(".desc-button").addEventListener("click",function(){d.fire({title:this.getAttribute("data-title"),text:this.getAttribute("data-synopsis"),icon:"info",confirmButtonText:"Fermer"})}),s.querySelector(".details-button").addEventListener("click",async function(){const o=Number(this.getAttribute("data-id")),p=this.getAttribute("data-title"),b=this.getAttribute("data-synopsis");await R({id:o,title:p,synopsis:b})}),x.appendChild(s),n.push(s)}),w({targets:n,opacity:[0,1],translateY:[-20,0],duration:450,delay:w.stagger(40)})}async function N(t){await D;const e=y.transaction(["mangas"],"readwrite").objectStore("mangas"),s=t.mal_id,i=e.get(s);i.onsuccess=function(){if(i.result){d.fire({icon:"info",title:"Déjà ajouté",text:` "${t.title}" est déjà dans ta bibliothèque.`});return}const o=t.synopsis?String(t.synopsis).replace(/\s+/g," ").trim():"Synopsis indisponible",p={id:s,title:t.title,images:t.images,synopsisText:o};e.add(p),d.fire({icon:"success",title:"Ajouté",text:` "${t.title}" a été ajouté !`})}}async function R({id:t,title:n,synopsis:e}){d.fire({title:n,html:`
      <div class="details">
        <p class="details__synopsis">${a(e||"Synopsis indisponible")}</p>
        <div class="details__loading">Chargement des détails...</div>
      </div>
    `,width:760,confirmButtonText:"Fermer",didOpen:async()=>{try{const s=await F(t),i=I(s,e),o=d.getHtmlContainer();o&&(o.querySelector(".details").innerHTML=i)}catch{const i=d.getHtmlContainer();if(i){const o=i.querySelector(".details");o&&(o.innerHTML=`
              <p class="details__synopsis">${a(e||"Synopsis indisponible")}</p>
              <p class="details__error">Impossible de charger les détails (API). Réessaye.</p>
            `)}}}})}async function F(t){if($.has(t))return $.get(t);const e=(await P.get(`https://api.jikan.moe/v4/anime/${t}/full`)).data?.data;return $.set(t,e),e}function I(t,n){t?.title;const e=t?.score??"—",s=t?.episodes??"—",i=t?.status??"—",o=t?.year??t?.aired?.prop?.from?.year??"—",p=(t?.studios||[]).map(c=>c.name).filter(Boolean),b=(t?.genres||[]).map(c=>c.name).filter(Boolean),q=t?.synopsis?String(t.synopsis).replace(/\s+/g," ").trim():n||"Synopsis indisponible",B=t?.theme?.openings||[],j=t?.theme?.endings||[],k=t?.trailer?.url||"";return`
    <div class="details">
      <p class="details__synopsis">${a(q)}</p>

      <div class="details__grid">
        <div class="details__item"><span>⭐ Score</span><strong>${a(e)}</strong></div>
        <div class="details__item"><span>📺 Episodes</span><strong>${a(s)}</strong></div>
        <div class="details__item"><span>📌 Statut</span><strong>${a(i)}</strong></div>
        <div class="details__item"><span>🗓️ Année</span><strong>${a(o)}</strong></div>
      </div>

      ${p.length?`<p class="details__line"><strong>Studios :</strong> ${a(p.join(", "))}</p>`:""}
      ${b.length?`<p class="details__line"><strong>Genres :</strong> ${a(b.join(", "))}</p>`:""}

      <div class="details__themes">
        <div class="details__theme">
          <h3>Openings</h3>
          ${B.length?`<ul>${B.slice(0,8).map(c=>`<li>${a(c)}</li>`).join("")}</ul>`:'<p class="details__muted">Non disponible</p>'}
        </div>
        <div class="details__theme">
          <h3>Endings</h3>
          ${j.length?`<ul>${j.slice(0,8).map(c=>`<li>${a(c)}</li>`).join("")}</ul>`:'<p class="details__muted">Non disponible</p>'}
        </div>
      </div>

      ${k?`<p class="details__line"><a class="details__link" href="${g(k)}" target="_blank" rel="noopener">▶️ Voir le trailer</a></p>`:""}

      <p class="details__muted">⚠️ L’API donne les titres des openings/endings, pas les fichiers audio.</p>
    </div>
  `}function g(t){return String(t??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function a(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
