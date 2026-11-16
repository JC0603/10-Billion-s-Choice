const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),XLSX=require('../vendor/xlsx.full.min.js'),E=require('../engine.js');
const ref=JSON.parse(fs.readFileSync(path.join(__dirname,'references.json'),'utf8')),report=[];
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
for(const [key,n] of Object.entries({large:33,medium:83,small:165,basic:380})){
 const wb=XLSX.read(fs.readFileSync(path.join(root,'data','io-2023-'+key+'.xlsx')),{type:'buffer'}),book={};for(const s of wb.SheetNames)book[s]=XLSX.utils.sheet_to_json(wb.Sheets[s],{header:1,defval:null,blankrows:true});const m=E.fromSheets(book);assert.equal(m.n,n);assert.equal(wb.SheetNames.length,12);
 const r=ref[key],items=[{code:r.codes[0],share:40},{code:r.codes[1],share:60}],a=E.simulate(m,items,10000);a.rows.forEach((row,i)=>{close(row.production,r.x[i]);close(row.imports,r.m[i]);close(row.valueAdded,r.v[i]);});close(a.valueAdded+a.imports,a.demand);
 const b=E.simulate(m,items,20000);for(const k of ['production','imports','valueAdded'])close(b[k],a[k]*2);
 const single=E.simulate(m,[{code:m.codes[0],share:100}],10000),merged=E.simulate(m,[{code:m.codes[0],share:40},{code:m.codes[0],share:60}],10000);close(single.production,merged.production);
 const rank=E.ranking(m,10000);assert.equal(rank.length,m.outputs.filter(x=>x>0).length);close(rank[0].production,single.production);
 m.outputs.forEach((x,i)=>{if(x<=0)assert.throws(()=>E.simulate(m,[{code:m.codes[i],share:100}],10000),/국내 생산/);});
 for(const budget of [NaN,Infinity,0,-1,1e9])assert.throws(()=>E.simulate(m,items,budget));for(const item of [[],[{code:'INVALID',share:100}],[{code:m.codes[0],share:99}],[{code:m.codes[0],share:null}],[{code:m.codes[0],share:NaN}],[{code:m.codes[0],share:-1}]])assert.throws(()=>E.simulate(m,item,10000));
 for(const s of wb.SheetNames){const meta=E.sheetInfo(m,s);assert.ok(meta.rows.length>=n);assert.ok(E.explore(m,s,meta.rows[0].code).length>0);}
 book['생산유발계수'][6][2]+=0.01;assert.throws(()=>E.fromSheets(book),/검증/);
 report.push({level:key,sectors:n,sheets:12,passed:true,independentPython:true,eligibleSectors:rank.length,residuals:m.validation});console.log('PASS',key,n,'sectors / independent solution / validation / units / input errors / all sheets');
}
fs.writeFileSync(path.join(root,'validation-report.json'),JSON.stringify({date:'2026-11-17',passed:true,results:report},null,2));
