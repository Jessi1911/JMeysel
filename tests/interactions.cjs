// Dependency-free regression tests: real script with a minimal DOM and virtual clock.
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
function setup(reduced=false) {
  let now=0, id=0; const timers=new Map(), nodes=new Map(), listeners={};
  class Element {
    constructor(name='') { this.id=name; this.textContent=''; this.style={setProperty(k,v){this[k]=v}}; this.children=[]; this.attrs={}; this.handlers={}; this.offsetWidth=100; const classes=new Set(); this.classList={add:(...a)=>a.forEach(x=>classes.add(x)),remove:(...a)=>a.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,v)=>v?classes.add(x):classes.delete(x)}; }
    set innerHTML(v){this.textContent=v.replace(/<br>/g,' ').replace(/<[^>]+>/g,'');} get innerHTML(){return this.textContent;}
    addEventListener(n,f){(this.handlers[n]??=[]).push(f)}
    setAttribute(k,v){this.attrs[k]=v} removeAttribute(k){delete this.attrs[k]}
    getBoundingClientRect(){return {left:0,top:0,right:390,bottom:844,width:120,height:28}}
    focus(){doc.activeElement=this} append(n){this.children.push(n)} closest(){return null}
  }
  const get=n=>{if(!nodes.has(n))nodes.set(n,new Element(n));return nodes.get(n)};
  const doc={hidden:false,readyState:'complete',body:get('body'),documentElement:get('root'),getElementById:get,createElement:()=>new Element(),querySelector:s=>get(s),querySelectorAll:s=>[get(s+'1'),get(s+'2'),get(s+'3')],addEventListener(n,f){(listeners[n]??=[]).push(f)}};
  doc.documentElement.scrollHeight=844;
  const schedule=(f,ms,repeat=0)=>{timers.set(++id,{f,time:now+ms,repeat});return id};
  const ctx={document:doc,innerWidth:390,innerHeight:844,performance:{now:()=>now},Date:{now:()=>now},Math,Set,Map,localStorage:{getItem:()=>null,setItem(){}},setTimeout:(f,ms)=>schedule(f,ms),clearTimeout:i=>timers.delete(i),setInterval:(f,ms)=>schedule(f,ms,ms),requestAnimationFrame:f=>schedule(f,16),cancelAnimationFrame:i=>timers.delete(i)};
  ctx.window={...ctx,matchMedia:q=>({matches:q.includes('reduce')?reduced:false,addEventListener(){}}),addEventListener:doc.addEventListener};
  vm.runInNewContext(fs.readFileSync(__dirname+'/../script.js','utf8'),ctx);
  function advance(ms){const end=now+ms;let t;while((t=[...timers.entries()].filter(([,v])=>v.time<=end).sort((a,b)=>a[1].time-b[1].time)[0])){now=t[1].time;timers.delete(t[0]);if(t[1].repeat)timers.set(t[0],{...t[1],time:now+t[1].repeat});t[1].f()}now=end}
  function emit(n,e={}){e.target??=new Element();e.preventDefault??=()=>{};(listeners[n]||[]).forEach(f=>f(e))}
  function click(n){(get(n).handlers.click||[]).forEach(f=>f({clientX:200,clientY:200,target:get(n)}))}
  return {get,doc,advance,emit,click};
}
for(const reduced of [false,true]) {
  const a=setup(reduced);
  assert.match(a.get('headline').textContent,/Hier gibt es/);
  a.click('actionBtn');a.click('actionBtn');a.advance(3000);
  assert.equal(a.get('headline').textContent,'Du bist noch da.');
  for(let i=0;i<13;i++){a.click('actionBtn');a.advance(3000)}
  assert.equal(a.get('headline').textContent,'Schön, dass du dageblieben bist.');
  a.advance(4000);assert.equal(a.get('epilogueLine2').textContent,'Vielleicht gibt es dann schon etwas.');
  a.click('brand');a.advance(3000);assert.match(a.get('headline').textContent,/Hier gibt es/);
  a.advance(16000);assert.ok(a.get('idleHint').textContent);
  const lines=[];
  for(let i=0;i<14;i++){a.click('menuTrigger');a.advance(1600);lines.push(a.get('siteMenuEmpty').textContent);a.emit('keydown',{key:'Tab'});assert.equal(a.doc.activeElement.id,'menuTrigger');a.emit('keydown',{key:'Escape'});assert.equal(a.get('menuTrigger').attrs['aria-expanded'],'false')}
  assert.equal(new Set(lines.slice(3,10)).size,7);
  const empty=[];for(let i=0;i<20;i++){a.emit('click');empty.push(a.get('emptyReaction').textContent);a.advance(800)}
  assert.equal(new Set(empty.slice(0,10)).size,10);assert.notEqual(empty[9],empty[10]);
  a.emit('wheel',{deltaY:100});const scroll=a.get('scrollHint').textContent;a.advance(5100);
  a.emit('touchstart',{touches:[{clientX:100,clientY:300}]});a.emit('touchmove',{touches:[{clientX:102,clientY:200}]});assert.notEqual(a.get('scrollHint').textContent,scroll);
  const before=a.get('nothingGrowth').children.length;a.doc.hidden=true;a.emit('visibilitychange');a.advance(600000);assert.equal(a.get('nothingGrowth').children.length,before);
  a.doc.hidden=false;a.emit('visibilitychange');a.advance(600000);assert.equal(a.get('nothingGrowth').children.length,9);
  if(reduced)assert.ok(a.get('emptyReaction').textContent==='War da gerade etwas?');else assert.ok(a.get('spark').classList.contains('is-active'));
  console.log(`PASS: story, rapid clicks, reset, idle, menu focus/variation, empty shuffle, wheel/touch, hidden pause, bounded growth, surprise (reduced=${reduced})`);
}
