// AEA 770:2017, tables 770.10.VIII/IX. Counts exclude one PE.
// Homogeneous tabulated sets use the table, not a second 35% restriction.
const sections = [1.5, 2.5, 4, 6, 10, 16];
const families = {
  CL: [
    [16,102,[3,2,0,0,0,0]], [19,164,[5,3,2,0,0,0]],
    [22,223,[7,5,3,2,0,0]], [25,309,[10,7,5,2,0,0]],
    [32,527,[0,12,9,5,3,2]], [38,814,[0,0,0,8,5,4]], [51,1545,[0,0,0,16,11,8]],
  ],
  RSP: [
    [16,146,[4,3,2,0,0,0]], [20,235,[8,5,4,2,0,0]],
    [22,302,[10,7,5,2,0,0]], [25,388,[13,9,6,3,2,0]],
    [32,649,[0,15,12,7,4,3]], [40,1034,[0,0,0,11,7,5]], [50,1668,[0,0,0,18,12,9]],
  ],
};
// Maximum insulated diameters underlying the AEA tables, not bare copper diameters.
const diameters = {1.5:3.5,2.5:4.2,4:4.8,6:6.3,10:7.6,16:8.8};
export function recommendConduits(assignments, {incomplete=false, feeder=false}={}) {
  const wires=assignments.flatMap(a=>a.wires);
  const pending={corrugated:null,rigid:null,method:'pending'};
  if(incomplete || !wires.length || wires.some(w=>!diameters[w.section] || !Number.isInteger(w.count) || w.count<1)) return pending;
  const active=wires.filter(w=>w.role!=='pe'), pe=wires.filter(w=>w.role==='pe');
  const same=active.length && active.every(w=>w.section===active[0].section);
  const tabulated=same && pe.reduce((n,w)=>n+w.count,0)===1 && pe.every(w=>w.section===Math.max(2.5,active[0].section));
  const count=active.reduce((n,w)=>n+w.count,0), index=sections.indexOf(active[0]?.section);
  const occupied=wires.reduce((n,w)=>n+w.count*Math.PI*diameters[w.section]**2/4,0);
  const minimumArea=Math.PI*(feeder?15:13)**2/4;
  const choose=family=>{
    const row=families[family].find(([,area,capacity])=>area>=minimumArea &&
      (tabulated && index>=0 && capacity[index]>0 ? count<=capacity[index] : occupied<=area*0.35));
    return row ? family+row[0] : null;
  };
  return {corrugated:choose('CL'),rigid:choose('RSP'),method:tabulated?'table':'mixed-fill'};
}
