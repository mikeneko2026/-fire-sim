(function(){
  var ids=["income","age","asset","monthly","bonus","ret","cost","swr"],$=function(i){return document.getElementById(i)};
  function num(i){var v=parseFloat($(i).value);return isFinite(v)?v:0}
  function fmt(m){if(m>=10000)return (m/10000).toFixed(2).replace(/\.?0+$/,"")+"億円";return Math.round(m).toLocaleString("ja-JP")+"万円"}
  function months(p,cost){var g=Math.max(0,cost)/(p.swr/100);if(p.asset>=g)return 0;var r=Math.pow(1+p.ret/100,1/12)-1,a=p.asset;
    for(var m=1;m<=720;m++){a=a*(1+r)+p.monthly;if(m%12===0)a+=p.bonus;if(a>=g)return m}return -1}
  function run(){
    var p={};ids.forEach(function(k){p[k]=num(k)});if(p.swr<=0)p.swr=4;
    var sideCost=Math.max(0,p.cost-p.income*12),gS=sideCost/(p.swr/100),gF=p.cost/(p.swr/100);
    var mS=months(p,sideCost),mF=months(p,p.cost),hl=$("headline");
    $("s-goal").textContent=fmt(gS);$("s-full").textContent=fmt(gF);
    if(mS<0){hl.innerHTML='<span class="age" style="color:var(--goal)">60年以内は未達</span><span class="sub">積立額や副収入を見直してください。</span>'}
    else if(mS===0){hl.innerHTML='<span class="age">達成済み</span><span class="sub">今の資産でサイドFIREの目標額を超えています。</span>'}
    else{hl.innerHTML='<span class="age">'+(p.age+mS/12).toFixed(1)+'<small>歳</small></span><span class="sub">でサイドFIREに届く見込みです。</span>'}
    $("s-diff").textContent=(mS>=0&&mF>=0)?((mF-mS)/12).toFixed(1)+"年":"—";
    // bar chart
    var levels=[0,3,5,8,10,15];if(levels.indexOf(p.income)<0){levels.push(p.income);levels.sort(function(a,b){return a-b})}
    var rows=levels.map(function(inc){var m=months(p,p.cost-inc*12);return {inc:inc,age:m<0?null:p.age+m/12}});
    var W=640,H=260,L=70,R=60,T=10,B=10,bh=Math.min(28,(H-T-B)/rows.length-8),maxA=p.age;
    rows.forEach(function(r){if(r.age&&r.age>maxA)maxA=r.age});maxA=Math.ceil((maxA+2)/5)*5;
    var X=function(a){return L+(W-L-R)*(a-p.age)/(maxA-p.age||1)},h="";
    rows.forEach(function(r,i){var y=T+i*((H-T-B)/rows.length)+4,cur=r.inc===p.income;
      h+='<text x="'+(L-10)+'" y="'+(y+bh/2+4)+'" text-anchor="end" font-size="12" fill="var(--muted)" font-family="var(--f-num)">月'+r.inc+'万</text>';
      if(r.age===null){h+='<text x="'+L+'" y="'+(y+bh/2+4)+'" font-size="12" fill="var(--goal)">60年以内は未達</text>';return}
      var w=Math.max(2,X(r.age)-L);
      h+='<rect x="'+L+'" y="'+y+'" width="'+w.toFixed(1)+'" height="'+bh+'" rx="3" fill="var(--ai)" fill-opacity="'+(cur?1:0.35)+'"/>';
      h+='<text x="'+(L+w+8)+'" y="'+(y+bh/2+4)+'" font-size="12" font-weight="'+(cur?700:400)+'" fill="var(--ink)" font-family="var(--f-num)">'+r.age.toFixed(1)+'歳</text>'});
    $("chart").innerHTML=h;
  }
  ids.forEach(function(k){$(k).addEventListener("input",run)});$("f").addEventListener("submit",function(e){e.preventDefault()});run();
})();
