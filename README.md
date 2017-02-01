### Tower of Hanoi
Created with [three.js](https://threejs.org/), a Javascript library created by [mrdoob](https://github.com/mrdoob) to make using WebGL easier.

### User Stories
#### Must-haves:
1) I can move around and explore space surrounding the towers.
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

4) I can see instructions that tell me:
  * How to move.
  * Rules for solving the puzzle.

#### Nice-to-haves:

5) Add spotlight to the target platform.
  * TODO: If stack is on left platform, switch spotlight to right. If stack is on right platform, switch spotlight to left.

6) TODO: I can see how many moves I've done and the minimum number of moves it takes to solve the puzzle.

7) TODO: Score calculated based on number of moves I did vs. minimum number of moves and the time elapsed to get from one platform to the other.

8) TODO: Floor fades into the distance.

9) TODO: Floor has texture (e.g. wooden platform around where the discs are, grass everywhere else).

10) TODO: Loading screen.

11) TODO: Implement collision detection and physics (make discs actually drop-able and if they don't fall on top of the stack, make user move around and pick them up).

12) TODO: User can only pick up discs if they are "in range" of them.

### Credits

[This Youtube playlist](https://www.youtube.com/playlist?list=PLCTVwBLCNozSGfxhCIiEH26tbJrQ2_Bw3) got me started. Without it, this project would have taken way longer.

Infinite thanks to [cabbibo](https://github.com/cabbibo) for their [ObjectControls project](https://github.com/cabbibo/ObjectControls), especially the [Drag and Drop](https://github.com/cabbibo/ObjectControls/blob/master/examples/drag.html) example. So useful.
