"""원본 Excel을 이용한 NumPy 독립검증. 실행: python scripts/model.py"""
from pathlib import Path
import json,numpy as np,openpyxl
ROOT=Path(__file__).resolve().parents[1]
def main():
 refs={}
 for key,n in [('large',33),('medium',83),('small',165),('basic',380)]:
  w=openpyxl.load_workbook(ROOT/'data'/('io-2023-'+key+'.xlsx'),read_only=True,data_only=True)
  book={s:list(w[s].values) for s in w.sheetnames};w.close();r=book['국산투입계수(Ad)'];rc={str(x[0]).strip() for x in r[6:]};codes=[str(c).strip() for c in r[4][2:] if c is not None and str(c).strip() in rc and not(str(c).isdigit() and int(c)>=9000)];assert len(codes)==n
  def matrix(name):
   r=book[name];ri={str(x[0]).strip():x for x in r[6:]};ci={str(x).strip():i for i,x in enumerate(r[4])};return np.array([[ri[c][ci[k]] for k in codes] for c in codes],dtype=float)
  r=book['총투입계수(A)'];va=next(x for x in r if str(x[0])=='9690');ci={str(c).strip():j for j,c in enumerate(r[4])};v=np.array([va[ci[c]] for c in codes],dtype=float)
  ad,am,L,M,V=[matrix(s) for s in ['국산투입계수(Ad)','수입투입계수(Am)','생산유발계수','수입유발계수','부가가치유발계수']]
  errors=[np.max(np.abs((np.eye(n)-ad)@L-np.eye(n))),np.max(np.abs(am@L-M)),np.max(np.abs(v[:,None]*L-V))];assert max(errors)<1e-8
  f=np.zeros(n);f[0]=4000;f[-2]=6000;x=np.linalg.solve(np.eye(n)-ad,f);m=am@x;value=v*x
  assert np.allclose(x,L@f,rtol=1e-10,atol=1e-7);assert np.allclose(m,M@f,rtol=1e-10,atol=1e-7);assert np.allclose(value,V@f,rtol=1e-10,atol=1e-7);assert abs(value.sum()+m.sum()-10000)<1e-6
  refs[key]={'codes':[codes[0],codes[-2]],'x':x.tolist(),'m':m.tolist(),'v':value.tolist()};print(key,n,'PASS',flush=True)
 (ROOT/'tests/references.json').write_text(json.dumps(refs))
if __name__=='__main__':main()
