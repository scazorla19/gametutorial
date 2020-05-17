import Phaser from 'phaser';
import loadScene from './scenes/loadScene';
import gameScene from './scenes/gameScene';

export const config = {
  type: Phaser.AUTO,
  width: 512, //256
  height: 544, //272
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: 0x000000,
  scene: [
    loadScene,
    gameScene
  ],
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  pixelArt: true
};

export const gameSettings = {
  playerSpeed: 200
};

export default new Phaser.Game(config);
