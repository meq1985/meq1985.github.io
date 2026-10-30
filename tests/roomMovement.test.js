import { expect, it } from 'vitest';
import { moveRoom } from '../src/services/roomMovement';
const drawing = () => ({ rooms: [{ id:'a',levelId:'ground',x:2,y:2,width:4,depth:3,points:[{id:'a1'},{id:'a2'}] },{id:'b',levelId:'upper',points:[{id:'b1'}]}], materials:{junctions:[],routes:[
  {id:'inside',fromId:'a1',toId:'a2',bends:[{x:3,y:3},{x:7,y:3}]},
  {id:'cross',fromId:'a1',toId:'b1',bends:[{x:4,y:3,levelId:'ground'},{x:8,y:8,levelId:'ground'},{x:4,y:3,levelId:'upper'}]},
  {id:'reverse',fromId:'b1',toId:'a2',bends:[{x:3,y:3,levelId:'ground'},{x:3,y:3,levelId:'upper'}]},
  {id:'foreign',fromId:'b1',toId:'other',bends:[{x:3,y:3}]},
]}});
it('moves every bend of an internal connection by the exact room displacement',()=>{
 const s=drawing();moveRoom(s,'a',5,4);expect(s.materials.routes[0].bends).toEqual([{x:6,y:5},{x:10,y:5}]);
 expect(s.rooms[0]).toMatchObject({x:5,y:4});expect(s.rooms[0].points[0].id).toBe('a1');
});
it('moves only connected bends inside the room on its floor, including reverse cross-floor paths',()=>{
 const s=drawing();moveRoom(s,'a',3,2.5);
 expect(s.materials.routes[1].bends).toEqual([{x:5,y:3.5,levelId:'ground'},{x:8,y:8,levelId:'ground'},{x:4,y:3,levelId:'upper'}]);
 expect(s.materials.routes[2].bends).toEqual([{x:4,y:3.5,levelId:'ground'},{x:3,y:3,levelId:'upper'}]);
 expect(s.materials.routes[3].bends).toEqual([{x:3,y:3}]);
});
