import{S as c,b as f,a as $}from"./anime.es-C48xQsAk.js";/* empty css              */let d;const y=new Map,b=indexedDB.open("mangaDB",1);b.onerror=function(){console.log("Erreur d’ouverture de la base de données")};b.onsuccess=function(t){d=t.target.result,v()};b.onupgradeneeded=function(t){d=t.target.result,d.objectStoreNames.contains("mangas")||d.createObjectStore("mangas",{keyPath:"id"})};function v(){const s=d.transaction(["mangas"],"readonly").objectStore("mangas").getAll();s.onsuccess=function(n){const e=n.target.result||[];S(e)},s.onerror=function(n){console.error("Erreur getAll:",n.target.error)}}function S(t){const a=document.getElementById("library-cards"),s=document.getElementById("library-empty");if(a.innerHTML="",!t.length){s&&(s.style.display="block");return}s&&(s.style.display="none");const n=[];t.forEach(e=>{const i=document.createElement("div");i.classList.add("anime-card");const p=e.synopsisText?String(e.synopsisText).replace(/\s+/g," ").trim():e.synopsis?String(e.synopsis).replace(/\s+/g," ").trim():"Synopsis indisponible";i.innerHTML=`
      <img src="${e.images?.jpg?.image_url||""}" alt="${l(e.title)}">
      <h3>${r(e.title)}</h3>

      <div class="actions">
        <button class="delete-from-db">Supprimer</button>

        <button class="details-button"
          data-id="${e.id}"
          data-title="${l(e.title)}"
          data-synopsis="${l(p)}"
        >Détails</button>

        <button class="desc-button"
          data-title="${l(e.title)}"
          data-synopsis="${l(p)}"
        >Voir Description</button>
      </div>
    `,i.querySelector(".delete-from-db").addEventListener("click",async()=>{(await c.fire({icon:"warning",title:"Supprimer ?",text:`Retirer "${e.title}" de ta bibliothèque ?`,showCancelButton:!0,confirmButtonText:"Oui",cancelButtonText:"Non"})).isConfirmed&&A(e.id)}),i.querySelector(".desc-button").addEventListener("click",function(){c.fire({title:this.getAttribute("data-title"),text:this.getAttribute("data-synopsis"),icon:"info",confirmButtonText:"Fermer"})}),i.querySelector(".details-button").addEventListener("click",async function(){const u=Number(this.getAttribute("data-id")),m=this.getAttribute("data-title"),g=this.getAttribute("data-synopsis");await x({id:u,title:m,synopsis:g})}),a.appendChild(i),n.push(i)}),f({targets:n,opacity:[0,1],translateY:[-20,0],duration:400,delay:f.stagger(35)})}function A(t){const n=d.transaction(["mangas"],"readwrite").objectStore("mangas").delete(t);n.onsuccess=function(){c.fire({icon:"success",title:"Supprimé",text:"Retiré de ta bibliothèque."}),v()},n.onerror=function(e){console.error("Erreur delete:",e.target.error)}}async function x({id:t,title:a,synopsis:s}){c.fire({title:a,html:`
      <div class="details">
        <p class="details__synopsis">${r(s||"Synopsis indisponible")}</p>
        <div class="details__loading">Chargement des détails...</div>
      </div>
    `,width:760,confirmButtonText:"Fermer",didOpen:async()=>{try{const n=await B(t),e=E(n,s),i=c.getHtmlContainer();i&&(i.querySelector(".details").innerHTML=e)}catch{const e=c.getHtmlContainer();if(e){const i=e.querySelector(".details");i&&(i.innerHTML=`
              <p class="details__synopsis">${r(s||"Synopsis indisponible")}</p>
              <p class="details__error">Impossible de charger les détails (API). Réessaye.</p>
            `)}}}})}async function B(t){if(y.has(t))return y.get(t);const s=(await $.get(`https://api.jikan.moe/v4/anime/${t}/full`)).data?.data;return y.set(t,s),s}function E(t,a){const s=t?.score??"—",n=t?.episodes??"—",e=t?.status??"—",i=t?.year??t?.aired?.prop?.from?.year??"—",p=(t?.studios||[]).map(o=>o.name).filter(Boolean),u=(t?.genres||[]).map(o=>o.name).filter(Boolean),m=t?.synopsis?String(t.synopsis).replace(/\s+/g," ").trim():a||"Synopsis indisponible",g=t?.theme?.openings||[],_=t?.theme?.endings||[],h=t?.trailer?.url||"";return`
    <div class="details">
      <p class="details__synopsis">${r(m)}</p>

      <div class="details__grid">
        <div class="details__item"><span>⭐ Score</span><strong>${r(s)}</strong></div>
        <div class="details__item"><span>📺 Episodes</span><strong>${r(n)}</strong></div>
        <div class="details__item"><span>📌 Statut</span><strong>${r(e)}</strong></div>
        <div class="details__item"><span>🗓️ Année</span><strong>${r(i)}</strong></div>
      </div>

      ${p.length?`<p class="details__line"><strong>Studios :</strong> ${r(p.join(", "))}</p>`:""}
      ${u.length?`<p class="details__line"><strong>Genres :</strong> ${r(u.join(", "))}</p>`:""}

      <div class="details__themes">
        <div class="details__theme">
          <h3>Openings</h3>
          ${g.length?`<ul>${g.slice(0,8).map(o=>`<li>${r(o)}</li>`).join("")}</ul>`:'<p class="details__muted">Non disponible</p>'}
        </div>
        <div class="details__theme">
          <h3>Endings</h3>
          ${_.length?`<ul>${_.slice(0,8).map(o=>`<li>${r(o)}</li>`).join("")}</ul>`:'<p class="details__muted">Non disponible</p>'}
        </div>
      </div>

      ${h?`<p class="details__line"><a class="details__link" href="${l(h)}" target="_blank" rel="noopener">▶️ Voir le trailer</a></p>`:""}

      <p class="details__muted">⚠️ L’API donne les titres des openings/endings, pas les fichiers audio.</p>
    </div>
  `}function l(t){return String(t??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function r(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
