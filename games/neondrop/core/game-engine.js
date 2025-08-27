import*as l from"./physics-pure.js";
import{
ParticleSystem as p
}from"../gameplay/particles.js";
import{
CONSTANTS as r,calculateGravityDelay as P
}from"../config.js";
import{
ScoringSystem as S
}from"../gameplay/scoring.js";
const u={
DROP_SPEEDS:{
NORMAL:1e3,FAST:50,LOCK_DELAY:750,LOCK_DELAY_FLOAT:900,LOCK_DELAY_DANGER:1500,MAX_LOCK_TIME:5e3,CLEAR_ANIMATION_TIME:200,SPAWN_FADE_TIME:400
},AUDIO:{
COOLDOWNS:{
LAND:50,ROTATE:100,CLEAR:200
}
},TRANSITIONS:{
GAME_OVER_LOCKOUT:3e3,MENU_TRANSITION:500,COUNTDOWN_DURATION:3e3
}
},a={
MENU:"MENU",MENU_TO_COUNTDOWN:"MENU_TO_COUNTDOWN",COUNTDOWN:"COUNTDOWN",COUNTDOWN_TO_PLAYING:"COUNTDOWN_TO_PLAYING",PLAYING:"PLAYING",PLAYING_TO_PAUSE:"PLAYING_TO_PAUSE",PAUSED:"PAUSED",PAUSE_TO_PLAYING:"PAUSE_TO_PLAYING",CLEARING:"CLEARING",GAME_OVER_SEQUENCE:"GAME_OVER_SEQUENCE",GAME_OVER:"GAME_OVER",GAME_OVER_TO_MENU:"GAME_OVER_TO_MENU"
};
class v{
constructor(t,e=null,s=null,i=null){
this.config=t,this.audio=e,this.blockchain=s,this.eventBus=i,this.particleSystem=new p,this.rng=new d(this.getDailySeed()),this.scoring=new S(t),this.state=this.createInitialState(),this.frameNumber=0,this.inputBuffer={
action:null,timestamp:0,bufferWindow:100
},this.transitions={
active:!1,type:null,startTime:0,duration:0,data:{

}
},this.timeDilation=1,this.inputLog=[],this.gameLog={
seed:this.rng.seed,startTime:Date.now(),inputs:[],stateSnapshots:[],finalScore:0,finalState:null,frameStates:[],stateChanges:[]
},this.bagRandomizer={
currentBag:[],nextBag:[],bagHistory:[],bagCount:0
},this.previousGameState=null,this.gameOverTriggered=!1,this.gameOverUITriggered=!1,this.gameOverComplete=!1,this.gameOverEventDispatched=!1,this.gameOverLockout={
active:!1,startTime:0,duration:u.TRANSITIONS.GAME_OVER_LOCKOUT,canStartNewGame:!1
},this.audioState={
lastLandSound:0,lastRotateSound:0,lastClearSound:0,landCooldown:u.AUDIO.COOLDOWNS.LAND,rotateCooldown:u.AUDIO.COOLDOWNS.ROTATE,clearCooldown:u.AUDIO.COOLDOWNS.CLEAR
},this.debugState={
lastGameOverReason:"",boardStateAtGameOver:null,pieceStateAtGameOver:null,frameAtGameOver:0
}
}createInitialState(){
return{
gameState:a.MENU,board:Array(r.BOARD.HEIGHT).fill().map(()=>Array(r.BOARD.WIDTH).fill(null)),isLocking:!1,currentPiece:null,currentPosition:{
x:0,y:0
},shadowPosition:{
x:0,y:0
},shadowValid:!1,lastShadowKey:"",shadowY:0,nextPiece:null,heldPiece:null,canHold:!0,score:0,lines:0,level:1,combo:0,lockTimer:0,clearTimer:0,countdownTimer:0,gravitySpeed:u.DROP_SPEEDS.NORMAL,gravityAccumulator:0,clearingLines:[],startTime:null,unlockedPieces:[...r.PIECES.STARTING],lastUnlockScore:0,statistics:{
piecesPlaced:0,maxCombo:0,floatUsed:0,linesCleared:0,tetrises:0,playTime:0
},transitionTimer:0,gameOverSequencePhase:0,gameOverStartTime:null,deathPiece:null,gameMode:"practice",pendingRewards:!1
}
}update(t){
this.frameNumber++,this.frameNumber%300===0&&this.logFrameState();
const e=t*this.timeDilation;
switch(this.state.gameState){
case a.MENU:break;
case a.MENU_TO_COUNTDOWN:this.updateMenuTransition(e);
break;
case a.COUNTDOWN:this.updateCountdown(e);
break;
case a.COUNTDOWN_TO_PLAYING:this.updateCountdownTransition(e);
break;
case a.PLAYING:!this.gameOverTriggered&&!this.gameOverComplete&&this.updatePlaying(e);
break;
case a.PLAYING_TO_PAUSE:this.updatePauseTransition(e);
break;
case a.PAUSED:break;
case a.PAUSE_TO_PLAYING:this.updateUnpauseTransition(e);
break;
case a.CLEARING:!this.gameOverTriggered&&!this.gameOverComplete&&this.updateClearing(e);
break;
case a.GAME_OVER_SEQUENCE:break;
case a.GAME_OVER:break;
case a.GAME_OVER_TO_MENU:this.updateReturnToMenuTransition(e);
break
}this.previousGameState!==this.state.gameState&&(this.state.gameState===a.GAME_OVER_SEQUENCE||this.state.gameState===a.PLAYING||this.state.gameState===a.MENU)&&(this.logStateChange(this.previousGameState,this.state.gameState),this.previousGameState=this.state.gameState),this.particleSystem.update(e)
}updatePlaying(t){
if(this.gameOverTriggered||this.gameOverComplete)return;
this.state.isSpawning&&(this.state.spawnTimer+=t,this.state.spawnTimer>=r.TIMING.SPAWN_FADE_TIME&&(this.state.isSpawning=!1,this.state.spawnTimer=0)),this.state.gravitySpeed=P(this.state.startTime,this.state.score,this.state.level),this.updateShadow();
const e=this.state.currentPosition.y>=this.state.shadowPosition.y;
this.state.currentPosition.y<this.state.shadowPosition.y?(this.state.gravityAccumulator+=t,this.state.gravityAccumulator>=this.state.gravitySpeed&&(this.state.gravityAccumulator-=this.state.gravitySpeed,this.movePiece(0,1)||(this.state.gravityAccumulator=0))):!this.state.isLocking&&e&&this.startLocking(),this.state.lockTimer>0&&this.updateLocking(t)
}canPieceSpawnOnBoard(t,e){
const s=r.PIECES.DEFINITIONS[t];
if(!s)return!1;
const i=s.spawn,o=s.shape;
for(let n=0;
n<o.length;
n++)for(let c=0;
c<o[0].length;
c++)if(o[n][c]){
const h=i.x+c,g=i.y+n;
if(h<0||h>=r.BOARD.WIDTH||g>=0&&g<r.BOARD.HEIGHT&&e[g][h]!==null)return!1
}return!0
}checkStackDanger(){
return this.state.currentPosition.y<0
}checkAlternativeSpawns(t){
const e=r.PIECES.DEFINITIONS[t];
if(!e)return!1;
const s={
x:e.spawn.x,y:e.spawn.y-1
},i={
...e,spawn:s
};
for(let o=0;
o<e.shape.length;
o++)for(let n=0;
n<e.shape[0].length;
n++)if(e.shape[o][n]){
const c=s.x+n,h=s.y+o;
if(c<0||c>=r.BOARD.WIDTH)continue;
if(h>=0&&h<r.BOARD.HEIGHT&&this.state.board[h][c]!==null)return!1
}return!0
}debugGameOver(t,e=null){
this.debugState.lastGameOverReason=t,this.debugState.boardStateAtGameOver=JSON.parse(JSON.stringify(this.state.board)),this.debugState.pieceStateAtGameOver={
type:this.state.currentPiece?.type,position:{
...this.state.currentPosition
},extraData:e
},this.debugState.frameAtGameOver=this.frameNumber
}playAudioWithCooldown(t,e={

}){
if(!this.audio)return;
const s=Date.now();
switch(t){
case"land":s-this.audioState.lastLandSound>this.audioState.landCooldown&&(this.audio.playSound("land",e),this.audioState.lastLandSound=s);
break;
case"rotate":s-this.audioState.lastRotateSound>this.audioState.rotateCooldown&&(this.audio.playSound("rotate",e),this.audioState.lastRotateSound=s);
break;
case"clear":s-this.audioState.lastClearSound>this.audioState.clearCooldown&&(this.audio.playSound("clear",e),this.audioState.lastClearSound=s);
break;
default:this.audio.playSound(t,e);
break
}
}startLocking(){
this.playAudioWithCooldown("land");
const t=r.TIMING.getLockDelay(this.state.currentPiece.type,this.state.currentPosition.y);
this.state.lockTimer=t,this.state.isLocking=!0
}hardDrop(){
if(!this.state.currentPiece)return;
const t=this.state.shadowPosition.y-this.state.currentPosition.y;
if(t>0){
this.state.currentPosition.y=this.state.shadowPosition.y;
const e=this.scoring.hardDrop(t);
this.state.score=this.scoring.score
}this.playAudioWithCooldown("land"),this.lockPiece()
}rotatePiece(t){
if(!this.state.currentPiece)return!1;
const e={
...this.state.currentPiece,gridX:this.state.currentPosition.x,gridY:this.state.currentPosition.y
},s=l.tryRotation(this.state.board,e,t);
return s.success?(this.state.currentPiece={
...s.piece,upMovesUsed:this.state.currentPiece.upMovesUsed
},this.state.currentPosition.x=s.piece.gridX,this.state.currentPosition.y=s.piece.gridY,this.state.shadowValid=!1,this.playAudioWithCooldown("rotate"),this.state.lockTimer>0&&(this.state.lockTimer=0,this.state.isLocking=!1),!0):!1
}startClearing(t){
this.state.gameState=a.CLEARING,this.state.clearingLines=t,this.state.clearTimer=r.TIMING.CLEAR_ANIMATION_TIME,this.playAudioWithCooldown("clear",{
lines:t.length
}),this.config.get("graphics.particles")&&this.particleSystem.createLineExplosion(t,this.state.board)
}gameOver(){
if(this.gameOverTriggered)return;
this.gameOverTriggered=!0,this.state.deathPiece={
...this.state.currentPiece,gridX:this.state.currentPosition.x,gridY:this.state.currentPosition.y,rotation:this.state.currentPiece.rotation,color:this.state.currentPiece.color,type:this.state.currentPiece.type
},this.state.finalScore=this.state.score,this.state.gameOverStartTime=Date.now(),this.state.gameState=a.GAME_OVER_SEQUENCE;
const t={
score:this.state.score,level:this.state.level,lines:this.state.lines,time:Date.now()-this.state.startTime,isNewHighScore:this.state.score>(this.config.get("game.highScore")||0),timestamp:Date.now(),deathPiece:this.state.deathPiece,gameOverStartTime:this.state.gameOverStartTime
};
if(this.eventBus)this.eventBus.emit("gameOver",t);
else{
const e=new CustomEvent("gameOver",{
detail:t
});
document.dispatchEvent(e)
}
}startTransition(t,e,s={

}){
this.transitions={
active:!0,type:t,startTime:Date.now(),duration:e,data:s
}
}getTransitionProgress(){
if(!this.transitions.active)return 1;
const t=Date.now()-this.transitions.startTime;
return Math.min(1,t/this.transitions.duration)
}finishClearing(){
if(this.gameOverTriggered||this.gameOverComplete)return;
const t=this.state.clearingLines.length;
this.state.board=l.removeClearedLines(this.state.board,this.state.clearingLines);
const e=this.scoring.lineClear(t,this.state.board),s=this.scoring.getState();
if(this.state.score=s.score,this.state.lines=s.lines,this.state.level=s.level,this.state.combo=s.combo,this.state.statistics.maxCombo=Math.max(this.state.statistics.maxCombo,this.state.combo),this.checkUnlocks(),this.state.clearingLines=[],!this.gameOverTriggered&&!this.gameOverComplete){
this.state.gameState=a.PLAYING;
const i=this.state.nextPiece?this.state.nextPiece.type:this.generatePiece().type;
if(!this.canPieceSpawnOnBoard(i,this.state.board)){
this.debugGameOver("post_clear_spawn_blocked",i),this.gameOver();
return
}this.spawnNextPiece(),this.processBufferedInput()
}
}spawnNextPiece(){
this.gameOverTriggered||this.gameOverComplete||(this.state.nextPiece||(this.state.nextPiece=this.generatePiece()),this.state.currentPiece=this.state.nextPiece,this.state.nextPiece=this.generatePiece(),this.state.currentPosition={
x:this.state.currentPiece.spawn.x,y:this.state.currentPiece.spawn.y
},this.state.canHold=!0,this.state.spawnTimer=0,this.state.isSpawning=!0,this.state.pieceSpawnTime=Date.now(),this.state.shadowValid=!1)
}updateShadow(){
if(!this.state.currentPiece)return;
const t=`${
this.state.currentPosition.x
},${
this.state.currentPosition.y
},${
this.state.currentPiece.rotation
}`;
if(this.state.lastShadowKey===t&&this.state.shadowValid)return;
const e=this.state.currentPosition.x;
let s=this.state.currentPosition.y;
const i={
...this.state.currentPiece,gridX:e,gridY:s
};
s=l.calculateStableShadow(this.state.board,i,e,this.state.currentPosition.y),this.state.shadowPosition={
x:e,y:s
},this.state.shadowValid=!0,this.state.lastShadowKey=t,this.state.shadowY=s
}movePiece(t,e){
if(!this.state.currentPiece||this.state.gameState!==a.PLAYING)return!1;
const s=this.state.currentPosition.x+t,i=this.state.currentPosition.y+e,o={
...this.state.currentPiece,gridX:s,gridY:i
};
return l.canPieceFitAt(this.state.board,o,s,i)?(this.state.currentPosition.x=s,this.state.currentPosition.y=i,this.state.lockTimer=0,this.state.isLocking=!1,this.state.shadowValid=!1,!0):this.state.currentPiece.type==="FLOAT"&&t!==0?this.tryFloatDiagonalMovement(t,e):!1
}tryFloatDiagonalMovement(t,e){
return e<0?this.tryFloatUpDiagonalMovement(t):this.tryFloatDownDiagonalMovement(t)
}tryFloatUpDiagonalMovement(t){
const e=this.state.currentPosition.x+t,s=this.state.currentPosition.y-1,i={
...this.state.currentPiece,gridX:e,gridY:s
};
return l.canPieceFitAt(this.state.board,i,e,s)?(this.state.currentPosition.x=e,this.state.currentPosition.y=s,this.state.lockTimer=0,this.state.isLocking=!1,this.state.shadowValid=!1,!0):!1
}tryFloatDownDiagonalMovement(t){
const e=this.state.currentPosition.x+t,s=this.state.currentPosition.y+1,i={
...this.state.currentPiece,gridX:e,gridY:s
};
return l.canPieceFitAt(this.state.board,i,e,s)?(this.state.currentPosition.x=e,this.state.currentPosition.y=s,this.state.lockTimer=0,this.state.isLocking=!1,this.state.shadowValid=!1,!0):!1
}updateLocking(t){
this.state.lockTimer-=t,this.state.lockTimer<=0&&this.lockPiece()
}findLinesToClear(){
const t=[];
for(let e=0;
e<r.BOARD.HEIGHT;
e++){
let s=!0;
for(let i=0;
i<r.BOARD.WIDTH;
i++)if(!this.state.board[e][i]){
s=!1;
break
}s&&t.push(e)
}return t
}updateMenuTransition(t){
this.getTransitionProgress()>=1&&(this.state.gameState=a.COUNTDOWN,this.state.countdownTimer=3e3,this.transitions.active=!1)
}updateCountdown(t){
this.state.countdownTimer-=t,this.state.countdownTimer<=0&&(this.state.gameState=a.COUNTDOWN_TO_PLAYING,this.startTransition("countdown-end",300))
}updateCountdownTransition(t){
this.getTransitionProgress()>=1&&(this.state.gameState=a.PLAYING,this.transitions.active=!1,this.processBufferedInput())
}updateClearing(t){
this.gameOverTriggered||this.gameOverComplete||(this.state.clearTimer>r.TIMING.CLEAR_ANIMATION_TIME*.9?this.timeDilation=.5:this.state.clearTimer<r.TIMING.CLEAR_ANIMATION_TIME*.1?this.timeDilation=.5+.5*(1-this.state.clearTimer/(r.TIMING.CLEAR_ANIMATION_TIME*.1)):this.timeDilation=1,this.state.clearTimer-=t,this.state.clearTimer<=0&&(this.timeDilation=1,this.finishClearing()))
}handleInput(t){
if(this.recordInput(t),!this.isInputBlocked()){
if(this.gameOverTriggered||this.gameOverComplete||this.state.gameState===a.GAME_OVER_SEQUENCE||this.state.gameState===a.GAME_OVER){
if(t.type==="START_GAME"&&this.canStartNewGame()){
this.startFreePlay(),this.resetGameOverLockout();
return
}if(t.type==="RETURN_TO_MENU"){
this.returnToMenu(),this.resetGameOverLockout();
return
}return
}if(this.shouldBufferInput(t)){
this.inputBuffer={
action:t,timestamp:Date.now()
};
return
}this.processInputAction(t)
}
}getDailySeed(){
const t=new Date,e=-5,s=new Date(t.getTime()+e*60*60*1e3);
let i;
s.getHours()>=23&&s.getMinutes()>=15?i=new Date(s.getTime()+1440*60*1e3):i=new Date(s);
const o=i.toISOString().split("T")[0];
return this.hashString(o)
}hashString(t){
let e=0;
for(let s=0;
s<t.length;
s++){
const i=t.charCodeAt(s);
e=(e<<5)-e+i,e=e&e
}return Math.abs(e)
}startGame(t="practice"){
this.gameOverTriggered=!1,this.gameOverUITriggered=!1,this.gameOverComplete=!1,this.gameOverEventDispatched=!1,this.gameOverSystem&&this.gameOverSystem.resetGameOverState&&this.gameOverSystem.resetGameOverState(),this.rng=new d(this.getDailySeed()),this.state=this.createInitialState(),this.state.gameMode=t,this.state.startTime=Date.now(),this.particleSystem.clear(),this.scoring.reset(),this.fillBag(),this.fillBag(),this.spawnNextPiece(),this.state.gameState=a.MENU_TO_COUNTDOWN,this.startTransition("countdown",1e3),window.dispatchEvent(new CustomEvent("gameStarted",{
detail:{
mode:t,timestamp:Date.now()
}
}))
}startFreePlay(){
this.startGame("practice")
}returnToMenu(){
this.gameOverTriggered=!1,this.gameOverUITriggered=!1,this.gameOverComplete=!1,this.gameOverEventDispatched=!1,this.gameOverSystem&&this.gameOverSystem.resetGameOverState&&this.gameOverSystem.resetGameOverState(),this.state=this.createInitialState(),this.particleSystem.clear(),this.resetGameOverLockout()
}getState(){
let t=this.state.gameState;
return t===a.PLAYING&&this.state.isLocking&&(t="LOCKING"),{
phase:t,board:this.state.board,current:this.state.currentPiece?{
...this.state.currentPiece,gridX:this.state.currentPosition.x,gridY:this.state.currentPosition.y,rotation:this.state.currentPiece.rotation||0
}:null,shadowY:this.state.shadowPosition.y,next:this.state.nextPiece,hold:this.state.heldPiece,canHold:this.state.canHold,score:this.state.score,lines:this.state.lines,level:this.state.level,combo:this.state.combo,countdownTimer:this.state.countdownTimer||0,lockTimer:this.state.lockTimer,clearingLines:this.state.clearingLines,startTime:this.state.startTime,frameCount:this.frameNumber,maxCombo:this.state.statistics.maxCombo,pieces:this.state.statistics.piecesPlaced,isNewHighScore:this.state.score>(this.config.get("game.highScore")||0),displayHighScore:Math.max(this.state.score,this.config.get("game.highScore")||0),lastUnlockScore:this.state.lastUnlockScore||0,unlockedPieces:this.state.unlockedPieces,gravityAccumulator:this.state.gravityAccumulator,currentGravityDelay:this.state.gravitySpeed,isLocking:this.state.isLocking,hasBufferedInput:this.inputBuffer.action!==null,transition:this.transitions.active?{
type:this.transitions.type,progress:this.getTransitionProgress(),data:this.transitions.data
}:null,timeDilation:this.timeDilation,metrics:this.scoring.getPerformanceMetrics(),deathPiece:this.state.deathPiece,gameOverStartTime:this.state.gameOverStartTime,dailySeed:this.getCurrentSeed(),dailyDate:this.getCurrentDate()
}
}getCurrentSeed(){
return this.rng.seed
}getCurrentDate(){
const t=new Date,e=-5,s=new Date(t.getTime()+e*60*60*1e3);
let i;
return s.getHours()>=23&&s.getMinutes()>=15?i=new Date(s.getTime()+1440*60*1e3):i=new Date(s),i.toISOString().split("T")[0]
}getParticles(){
return this.particleSystem.getParticles()
}tick(t){
this.update(t)
}isInputBlocked(){
// Check for game over lockout
if(this.gameOverLockout.active){
return Date.now()-this.gameOverLockout.startTime>=this.gameOverLockout.duration?
(this.gameOverLockout.canStartNewGame=!0,this.state.gameState===a.GAME_OVER_SEQUENCE):
!0;
}

// BLOCK INPUT DURING COUNTDOWN STATES
if([a.MENU_TO_COUNTDOWN,a.COUNTDOWN,a.COUNTDOWN_TO_PLAYING].includes(this.state.gameState)){
return true;
}

// EDGE CASE: Block input if countdown timer is still active (extra safety)
if(this.state.countdownTimer>0){
return true;
}

return false;
}canStartNewGame(){
return this.gameOverLockout.canStartNewGame||this.state.gameState===a.GAME_OVER
}resetGameOverLockout(){
this.gameOverLockout={
active:!1,startTime:0,duration:3e3,canStartNewGame:!1
}
}setGameOverSystem(t){
this.gameOverSystem=t
}setAudioSystem(t){
this.audio=t
}setBlockchainManager(t){
this.blockchain=t
}updatePauseTransition(){
this.getTransitionProgress()>=1&&(this.state.gameState=a.PAUSED,this.transitions.active=!1)
}updateUnpauseTransition(){
this.getTransitionProgress()>=1&&(this.state.gameState=a.PLAYING,this.transitions.active=!1)
}updateReturnToMenuTransition(){

}shouldBufferInput(){
return!1
}processBufferedInput(){

}processInputAction(t){
if(this.state.currentPiece)switch(t.type){
case"MOVE":this.movePiece(t.dx,t.dy);
break;
case"ROTATE":this.rotatePiece(t.direction);
break;
case"HARD_DROP":this.hardDrop();
break;
case"HOLD":break;
case"PAUSE":this.state.gameState===a.PLAYING?(this.startTransition("PAUSE",300),this.state.gameState=a.PLAYING_TO_PAUSE):this.state.gameState===a.PAUSED&&(this.startTransition("UNPAUSE",300),this.state.gameState=a.PAUSE_TO_PLAYING);
break;
case"UP_PRESSED":{
const e=this.state.currentPiece;
if(e&&e.type==="FLOAT"){
(e.upMovesUsed||0)<7&&this.movePiece(0,-1)&&(this.state.currentPiece.upMovesUsed=(e.upMovesUsed||0)+1,this.playAudioWithCooldown&&this.playAudioWithCooldown("float"));
break
}this.rotatePiece(1);
break
}case"SPACE":this.hardDrop();
break;
default:break
}
}recordInput(){

}logFrameState(){

}logStateChange(){

}recordStateSnapshot(){

}checkUnlocks(){
const t=r.PIECES.UNLOCK_THRESHOLDS;
let e=!1;
for(const[s,i]of Object.entries(t))this.state.score>=i&&!this.state.unlockedPieces.includes(s)&&(this.state.unlockedPieces.push(s),this.state.lastUnlockScore=this.state.score,e=!0);
e&&this.fillBag()
}generatePiece(){
// FORCE FLOAT PIECES - BYPASS BROKEN SYSTEM
if(Math.random() < 0.24){
    console.log(`🎯 ENGINE: FORCE GENERATING FLOAT PIECE`);
    return this.createPiece('FLOAT');
}

// Normal piece generation
this.bagRandomizer.currentBag.length===0&&this.fillBag();
const t=this.bagRandomizer.currentBag.pop();
return this.createPiece(t)
}

// Helper method to calculate current stack height
calculateStackHeight(){
if (!this.state || !this.state.board) {
    return 0;
}
const board = this.state.board;
let maxHeight = 0;
for (let x = 0; x < board[0].length; x++) {
    for (let y = 0; y < board.length; y++) {
        if (board[y][x] !== 0) {
            maxHeight = Math.max(maxHeight, board.length - y);
            break;
        }
    }
}
return maxHeight;
}fillBag(){
const e=[...[...this.state.unlockedPieces]].sort(()=>this.rng.random()-.5);
this.bagRandomizer.currentBag=e,this.bagRandomizer.bagCount++
}createPiece(t){
const e=r.PIECES.DEFINITIONS[t];
return{
type:t,shape:e.shape,color:e.color,spawn:e.spawn,rotation:0,upMovesUsed:0
}
}lockPiece(){
if(this.gameOverTriggered||this.gameOverComplete||!this.state.currentPiece)return;
this.state.board=l.placePiece(this.state.board,{
...this.state.currentPiece,gridX:this.state.currentPosition.x,gridY:this.state.currentPosition.y
}),this.state.statistics.piecesPlaced++;
let t=!1;
if(this.state.currentPiece.shape.forEach((s,i)=>{
s.forEach((o,n)=>{
o&&this.state.currentPosition.y+i<0&&(t=!0)
})
}),t){
this.gameOverSystem&&this.gameOverSystem.startBackgroundAPICalls(this.state.score,null,null),this.state.deathPiece={
...this.state.currentPiece,gridX:this.state.currentPosition.x,gridY:this.state.currentPosition.y,rotation:this.state.currentPiece.rotation,color:this.state.currentPiece.color,type:this.state.currentPiece.type
},this.debugGameOver("piece_above_visible_area",this.state.currentPosition.y),this.gameOver();
return
}const e=this.findLinesToClear();
if(e.length>0)this.startClearing(e);
else{
const s=this.state.nextPiece?this.state.nextPiece.type:this.generatePiece().type;
if(!this.canPieceSpawnOnBoard(s,this.state.board)){
this.gameOverSystem&&this.gameOverSystem.startBackgroundAPICalls(this.state.score,null,null),this.state.deathPiece={
...this.state.nextPiece,gridX:this.state.nextPiece.spawn.x,gridY:this.state.nextPiece.spawn.y,rotation:this.state.nextPiece.rotation,color:this.state.nextPiece.color,type:this.state.nextPiece.type
},this.debugGameOver("spawn_blocked",s),this.gameOver();
return
}this.spawnNextPiece()
}this.state.lockTimer=0,this.state.isLocking=!1
}
}class d{
constructor(t){
this.seed=t,this.state=t
}random(){
return this.state^=this.state<<13,this.state^=this.state>>17,this.state^=this.state<<5,(this.state>>>0)/4294967296
}
}export{
v as GameEngine,d as ProfessionalRNG
};

