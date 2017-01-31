#### Tower of Hanoi
Created with [three.js](https://threejs.org/), a Javascript library created by [mrdoob](https://github.com/mrdoob) to make using WebGL easier.

#### User Stories
1) I can move around and explore 3D space.
  W: forward
  A: backward
  S: turn right
  D: turn left
  Q: strafe left
  E: strafe right
  Space bar: move up and zoom out
  X: move down and zoom in

2) I can pick up and move the discs.
  * Only the one on top of a pile.
  * I can only move one at a time.

3) I can place a disc over the platform I want to put it on and if it is a legal move, it will snap into place. If the move is illegal, it will go back to where I got it from and tell me why the move didn't work.

4) The game tells me when I win. Strangely enough, without a time limit, there is no "losing" in this game unless I give up...which is impossible.

5) I can see how many moves I've done and the minimum number of moves it takes to solve the puzzle.

#### Credits

[This Youtube playlist](https://www.youtube.com/playlist?list=PLCTVwBLCNozSGfxhCIiEH26tbJrQ2_Bw3) got me started off. Without it, this project would have taken way longer.

Infinite thanks to [cabbibo](https://github.com/cabbibo) for their [ObjectControls project](https://github.com/cabbibo/ObjectControls), especially the [Drag and Drop](https://github.com/cabbibo/ObjectControls/blob/master/examples/drag.html) example. So useful.
