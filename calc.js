(function(){
  var ids=["age","asset","monthly","bonus","ret","cost","swr"];
  var $=function(id){return document.getElementById(id)};
  var MAXM=12*60;
  function num(id){var v=parseFloat($(id).value);return isFinite(v)?v:0}
  function fmt(man){
    if(man>=10000){return (man/10000).toFixed(man>=100000?0:2).replace(/\.?0+$/,"")+"億円"}
    return Math.round(man).toLocaleString("ja-JP")+"万円";
  }
  // 月次で資産を進め、目標到達月を返す
  function simulate(p){
    var r=Math.pow(1+p.ret/100,1/12)-1, a=p.asset, principal=p.asset, pts=[{m:0,a:a,pr:principal}], hit=-1;
    var goal=p.cost/(p.swr/100);
    if(a>=goal) hit=0;
    for(var m=1;m<=MAXM;m++){
      a=a*(1+r)+p.monthly; principal+=p.monthly;
      if(m%12===0){a+=p.bonus;principal+=p.bonus}
      if(hit<0&&a>=goal) hit=m;
      if(m%12===0) pts.push({m:m,a:a,pr:principal});
      if(hit>=0&&m>=hit+60&&m%12===0) break;
    }
    return {goal:goal,hit:hit,pts:pts,principalAtHit:null,r:r};
  }
  function monthsTo(p){var s=simulate(p);return s.hit}
  function aAt(s,m){ // 到達月の資産と元本を再計算
    var r=s.r,a=P.asset,pr=P.asset;
    for(var i=1;i<=m;i++){a=a*(1+r)+P.monthly;pr+=P.monthly;if(i%12===0){a+=P.bonus;pr+=P.bonus}}
    return {a:a,pr:pr};
  }
  var P;
  function draw(s){
    var svg=$("chart"),W=640,H=300,L=58,R=16,T=16,B=34;
    var last=s.pts[s.pts.length-1].m, maxA=s.goal*1.15;
    s.pts.forEach(function(p){if(p.a>maxA)maxA=p.a});
    var X=function(m){return L+(W-L-R)*m/last}, Y=function(v){return T+(H-T-B)*(1-v/maxA)};
    var step=Math.pow(10,Math.floor(Math.log10(maxA/4))),cands=[1,2,5,10],tick=step;
    for(var i=0;i<cands.length;i++){if(maxA/(step*cands[i])<=5){tick=step*cands[i];break}}
    var yrStep=last/12<=10?1:last/12<=25?5:10;
    var h="";
    for(var v=0;v<=maxA;v+=tick){h+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="var(--grid)"/>'+
      '<text x="'+(L-8)+'" y="'+(Y(v)+4)+'" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--f-num)">'+fmt(v).replace("万円","万")+'</text>'}
    for(var y=0;y*12<=last;y+=yrStep){h+='<text x="'+X(y*12)+'" y="'+(H-12)+'" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--f-num)">'+(P.age+y)+'歳</text>'}
    var area="M"+X(0)+" "+Y(0),line="",pl="";
    s.pts.forEach(function(p,i){line+=(i?"L":"M")+X(p.m).toFixed(1)+" "+Y(p.a).toFixed(1);pl+=(i?"L":"M")+X(p.m).toFixed(1)+" "+Y(p.pr).toFixed(1);area+="L"+X(p.m).toFixed(1)+" "+Y(p.a).toFixed(1)});
    area+="L"+X(last)+" "+Y(0)+"Z";
    h+='<path d="'+area+'" fill="var(--ai)" fill-opacity="0.10"/>';
    h+='<path d="'+pl+'" fill="none" stroke="var(--muted)" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="4 4"/>';
    h+='<path d="'+line+'" fill="none" stroke="var(--ai)" stroke-width="2.5"/>';
    h+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(s.goal)+'" y2="'+Y(s.goal)+'" stroke="var(--goal)" stroke-width="1.5" stroke-dasharray="6 4"/>';
    h+='<text x="'+(W-R)+'" y="'+(Y(s.goal)-6)+'" text-anchor="end" font-size="11" fill="var(--goal)">目標 '+fmt(s.goal)+'</text>';
    if(s.hit>0&&s.hit<=last){var hx=X(s.hit),hy=Y(s.goal);
      h+='<circle cx="'+hx+'" cy="'+hy+'" r="5.5" fill="var(--panel)" stroke="var(--ai)" stroke-width="2.5"/>';
      var lx=Math.min(Math.max(hx,L+30),W-R-30);
      h+='<text x="'+lx+'" y="'+(hy+20)+'" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ai)">'+(P.age+s.hit/12).toFixed(1)+'歳</text>'}
    svg.innerHTML=h;
  }
  function run(){
    P={};ids.forEach(function(k){P[k]=num(k)});
    if(P.swr<=0)P.swr=4; if(P.cost<=0)P.cost=1;
    var s=simulate(P), hl=$("headline"), tips=$("tips");
    $("s-goal").textContent=fmt(s.goal);
    if(s.hit<0){
      hl.innerHTML='<span class="age" style="color:var(--goal)">60年以内は未達</span><span class="sub">積立額か利回りの前提を見直すと到達時期が見えてきます。</span>';
      $("s-years").textContent="—";$("s-gain").textContent="—";
    }else if(s.hit===0){
      hl.innerHTML='<span class="age">達成済み</span><span class="sub">今の資産で目標額を超えています。</span>';
      $("s-years").textContent="0年";$("s-gain").textContent="—";
    }else{
      var y=s.hit/12, at=aAt(s,s.hit), gain=Math.max(0,(at.a-at.pr)/at.a*100);
      hl.innerHTML='<span class="age">'+(P.age+y).toFixed(1)+'<small>歳</small></span><span class="sub">で資産が目標額に届く見込みです。</span>';
      $("s-years").textContent=y.toFixed(1)+"年";
      $("s-gain").textContent=gain.toFixed(0)+"%";
    }
    // 感度：積立+1万円、生活費-20万円
    var t="";
    if(s.hit>0){
      var m1=monthsTo(Object.assign({},P,{monthly:P.monthly+1})), m2=monthsTo(Object.assign({},P,{cost:Math.max(1,P.cost-20)}));
      if(m1>=0)t+='<div class="tip">積立を<b>月1万円</b>増やすと<br><b>'+((s.hit-m1)/12).toFixed(1)+'年</b>早まります</div>';
      if(m2>=0)t+='<div class="tip">生活費を<b>年20万円</b>下げると<br><b>'+((s.hit-m2)/12).toFixed(1)+'年</b>早まります</div>';
    }
    if(P.swr>4.5)t+='<div class="warn" style="grid-column:1/-1">取り崩し率が4.5%を超えています。長期間のFIREでは資産が尽きるリスクが高まる水準です。</div>';
    tips.innerHTML=t;
    draw(s);
  }
  ids.forEach(function(k){$(k).addEventListener("input",run)});
  $("f").addEventListener("submit",function(e){e.preventDefault()});
  run();
})();
