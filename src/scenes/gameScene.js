import Phaser, { DOWN } from 'phaser';
import { gameSettings, config } from '../game';
import Beam from '../assets/Beam';
import Explosion from '../assets/explosion';

export default class gameScene extends Phaser.Scene {
  
  constructor() {
    super("gameScene");
  }
  
  create() {
    // Background
    this.background = this.add.tileSprite(0, 0, config.width, config.height, "background").setScale(2);
    this.background.setOrigin(0,0);
    
    // Player ship
    this.player = this.physics.add.sprite(config.width / 2 - 8, config.height - 64, "player");
    this.player.play("thrust");
    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.player.setCollideWorldBounds(true);
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Enemy ship
    this.ship = this.add.sprite(config.width / 2 - 50, config.height / 2, "ship");
    this.ship2 = this.add.sprite(config.width / 2, config.height / 2, "ship2");
    this.ship3 = this.add.sprite(config.width / 2 + 50, config.height / 2, "ship3");

    this.enemies = this.physics.add.group();
    this.enemies.add(this.ship);
    this.enemies.add(this.ship2);
    this.enemies.add(this.ship3);

    this.ship.play("ship_anim");
    this.ship2.play("ship2_anim");
    this.ship3.play("ship3_anim");

    this.ship.setInteractive();
    this.ship2.setInteractive();
    this.ship3.setInteractive();

    // Collision physics
    this.input.on("gameobjectdown", this.destroyShip, this);
    this.physics.world.setBoundsCollision();
    this.powerUps = this.physics.add.group();
    this.projectiles = this.add.group();

    const maxObjects = 4;
    for (let i = 0; i <= maxObjects; i++) {
      const powerUp = this.physics.add.sprite(16, 16, "power-up");
      this.powerUps.add(powerUp);
      powerUp.setRandomPosition(0, 0, config.width, config.height);

      if (Math.random() > 0.5) {
        powerUp.play("red");
      } else {
        powerUp.play("gray");
      }
      powerUp.setVelocity(100, 100);
      powerUp.setCollideWorldBounds(true);
      powerUp.setBounce(1);
    }

    this.physics.add.collider(this.projectiles, this.powerUps, (projectile, powerUp) => {
      projectile.destroy();
    });
    this.physics.add.overlap(this.player, this.powerUps, this.pickPowerUp, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hurtPlayer, null, this);
    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);

    // Scoreboard
    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(config.width, 0);
    graphics.lineTo(config.width, 20);
    graphics.lineTo(0, 20);
    graphics.lineTo(0, 0);
    graphics.closePath();
    graphics.fillPath();

    this.score = 0;
    this.scoreLabel = this.add.bitmapText(10, 5, "pixelFont", "SCORE", 16);

    // Sound FX
    this.beamSound = this.sound.add("audio_beam");
    this.explosionSound = this.sound.add("audio_explosion");
    this.pickupSound = this.sound.add("audio_pickup");

    // Music
    this.music = this.sound.add("music");
    const musicConfig = {
      mute: false,
      volume: 1,
      rate: 1,
      detune: 0,
      seek: 0,
      loop: false,
      delay: 0
    }
    this.music.play(musicConfig);
  }

  update() {
    this.moveShip(this.ship, 2);
    this.moveShip(this.ship2, 3);
    this.moveShip(this.ship3, 4);

    this.background.tilePositionY -= 0.5;
    this.movePlayerManager();

    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
      if (this.player.active) {
        this.shootBeam();
      }      
    }
    for (let i = 0; i < this.projectiles.getChildren().length; i++) {
      let beam = this.projectiles.getChildren()[i];
      beam.update();
    }
  }

  movePlayerManager() {
    if (this.cursorKeys.left.isDown) {
      this.player.setVelocityX(-gameSettings.playerSpeed);
    } else if (this.cursorKeys.right.isDown) {
      this.player.setVelocityX(gameSettings.playerSpeed);
    }

    // if (this.cursorKeys.up.isDown) {
    //   this.player.setVelocityY(-gameSettings.playerSpeed);
    // } else if (this.cursorKeys.down.isDown) {
    //   this.player.setVelocityY(gameSettings.playerSpeed);
    // }
  }

  moveShip(ship, speed) {
    ship.y += speed;
    if (ship.y > config.height) {
      this.resetShipPos(ship);
    }
  }

  shootBeam() {
    const beam = new Beam(this);
    this.beamSound.play();
  }

  resetShipPos(ship) {
    ship.y = 0;
    let randomX = Phaser.Math.Between(0, config.width);
    ship.x = randomX;
  }

  destroyShip(pointer, gameObject) {
    gameObject.setTexture("explosion");
    gameObject.play("explode");
  }

  pickPowerUp(player, powerUp) {
    powerUp.disableBody(true, true);
    this.pickupSound.play();
  }

  hurtPlayer(player, enemy) {
    this.resetShipPos(enemy);

    if (this.player.alpha < 1) {
      return;
    }

    const explosion = new Explosion(this, player.x, player.y);
    player.disableBody(true, true);
    
    this.time.addEvent({
      delay: 1000,
      callback: this.resetPlayer,
      callbackScope: this,
      loop: false
    });
  }

  hitEnemy(projectile, enemy) {
    const explosion = new Explosion(this, enemy.x, enemy.y);
    projectile.destroy();
    this.explosionSound.play();
    this.resetShipPos(enemy);
    this.score += 15;
    const scoreFormatted = this.zeroPad(this.score, 6);
    this.scoreLabel.text = "SCORE" + scoreFormatted;
  }

  zeroPad(number, size) {
    let stringNumber = String(number);
    while(stringNumber.length < (size || 2)) {
      stringNumber = "0" + stringNumber;
    }
    return stringNumber;
  }

  resetPlayer() {
    const x = config.width / 2 - 8;
    const y = config.height + 64;
    this.player.enableBody(true, x, y, true, true);

    this.player.alpha = 0.5;
    const tween = this.tweens.add({
      targets: this.player,
      y: config.height - 64,
      ease: 'Power1',
      duration: 1500,
      repeat: 0,
      onComplete: () => {
        this.player.alpha = 1;
      },
      callbackScope: this
    })

  }
};