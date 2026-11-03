// Spatial 3×3 masks for grayscale inputs: A in the input layer, B afterwards.
export const MASK_A = [[-1,-1],[-1,0],[-1,1],[0,-1]];
export const MASK_B = [...MASK_A,[0,0]];

function sources(index, offsets, size) {
  const r=Math.floor(index/size),c=index%size;
  return offsets.flatMap(([dr,dc])=>{
    const row=r+dr,col=c+dc;
    return row>=0&&row<size&&col>=0&&col<size ? [row*size+col] : [];
  });
}

export function receptiveField(target, layers, size=5) {
  if(!Number.isInteger(size)||size<1||size>20) throw new RangeError('Invalid grid size');
  if(!Number.isInteger(target)||target<0||target>=size*size) throw new RangeError('Invalid target');
  if(!Number.isInteger(layers)||layers<1||layers>100) throw new RangeError('Invalid layer count');
  let frontier=new Set([target]);
  for(let layer=layers;layer>=1;layer--) {
    const mask=layer===1?MASK_A:MASK_B;
    frontier=new Set([...frontier].flatMap(index=>sources(index,mask,size)));
  }
  return [...frontier].sort((a,b)=>a-b);
}

export function pixelcnnContext(target=16,layers=3,size=5) {
  const reachable=receptiveField(target,layers,size);
  // The B-mask graph is acyclic apart from self loops. At most size² steps
  // cover every hidden ancestor, followed by the input A-mask step.
  let ancestors=new Set([target]);
  for(let step=0;step<size*size;step++) {
    const next=new Set([...ancestors].flatMap(index=>sources(index,MASK_B,size)));
    if(next.size===ancestors.size) break;
    ancestors=next;
  }
  const possible=new Set([...ancestors].flatMap(index=>sources(index,MASK_A,size)));
  const past=Array.from({length:target},(_,i)=>i);
  return {target,layers,size,reachable,
    blind:past.filter(i=>!possible.has(i)),
    beyondDepth:past.filter(i=>possible.has(i)&&!reachable.includes(i)),
    future:Array.from({length:size*size-target-1},(_,i)=>target+1+i)};
}
