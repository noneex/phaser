const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 540,
  backgroundColor: '#5fbae8',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  },
  pixelArt: true
}

const game = new Phaser.Game(config)
let cursors, player, npc, platforms, spaceKey, bullets, lastFired = 0, graphics

function preload () {
  this.load.image('cubes', 'assets/img/cubes.png')
  this.load.image('bullet', 'assets/img/bullet.png')
  this.load.spritesheet('dude', 'assets/img/zero.png', { frameWidth: 16, frameHeight: 16 })
  this.load.spritesheet('girl', 'assets/img/one.png', { frameWidth: 16, frameHeight: 16 })
  this.load.spritesheet('red', 'assets/img/two.png', { frameWidth: 16, frameHeight: 16 })
  this.load.tilemapTiledJSON('map', 'assets/tilemap/basic.json')
}

function create () {
  
  graphics = this.add.graphics({ lineStyle: { color: 0x0000ff}, fillStyle: { color: 0x0000ff }})

  let map = this.make.tilemap({ key: 'map' })
  let tiles = map.addTilesetImage('cubes', 'cubes')
  let bgLayer = map.createStaticLayer(0, tiles, 0, 0).setScale(4)
  let interactLayer = map.createStaticLayer(1, tiles, 0, 0).setScale(4)
  
  npc = this.physics.add.group({ friction: {x: 0}})
  girl = npc.create(230, 100, 'girl').setScale(6)
  girl2 = npc.create(140, 100, 'girl').setScale(6)
  red = npc.create(560, 100, 'red').setScale(6)
  red.flipX = true
  player = this.physics.add.sprite(400, 100, 'dude').setScale(6)
  
  cursors = this.input.keyboard.createCursorKeys()  
  spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

  let Bullet = new Phaser.Class({
    Extends: Phaser.GameObjects.Image,
    initialize:
    function Bullet(scene) {
      Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet')

      this.lifespan = 0
      this.flipX = null
      this.setScale(5)
      this.speed = 1
    },
    fire: function(player) {
      this.setActive(true)
      this.setVisible(true)
      this.flipX = player.flipX
      this.lifespan = 1000
      this.body.allowGravity = false
      this.setPosition(player.x, player.y + 30)
    },
    update: function(time, delta) {
      this.lifespan -= delta
      if (this.flipX) {
        this.x -= this.speed * delta
      } else {
        this.x += this.speed * delta
      }
      
      if (this.lifespan <= 0) {
        this.destroy()
      } 
    }
  })

  bullets = this.physics.add.group({
    classType: Bullet,
    maxSize: 20,
    runChildUpdate: true
  })

  

  this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('dude', { start: 1, end: 2 }),
    frameRate: 7
  })
  this.anims.create({
    key: 'damage_r',
    frames: [{ key: 'red', frame: 5}, { key: 'red', frame: 0}],
    frameRate: 7
  })

  this.anims.create({
    key: 'walk_g',
    frames: this.anims.generateFrameNumbers('girl', { start: 1, end: 2 }),
    frameRate: 7
  })

  this.anims.create({
    key: 'shoot',
    frames: this.anims.generateFrameNumbers('dude', { start: 3, end: 4 }),
    frameRate: 10
  })

  this.anims.create({
    key: 'stay',
    frames: [ { key: 'dude', frame: 0}],
    frameRate: 20
  })
  
  this.cameras.main.y= 70  
  this.cameras.main.startFollow(player, true)
  this.physics.add.collider(player, interactLayer)
  this.physics.add.collider(npc, interactLayer)
  this.physics.add.overlap(npc, bullets, hitEnemy, null, this)

  map.setCollision(5)  
  
}

function update (time, delta) {


  if (cursors.left.isDown) {
    player.setVelocityX(-60)
    player.anims.play('walk', true)
    player.flipX = true
  } else if (cursors.right.isDown) {
    player.setVelocityX(60)
    player.anims.play('walk', true)
    player.flipX = false
  } else if (spaceKey.isDown && player.body.blocked.down) {
    if(time > lastFired) {
      let bullet = bullets.get()
      if (bullet) {
        bullet.fire(player)
        player.anims.play('shoot', true)
        player.setVelocityX(player.flipX ? 20 : -20)
        lastFired = time + 200
      }
    }
  } else {
    player.setVelocityX(0)
    player.anims.play('stay')
  }
  if (cursors.up.isDown && player.body.blocked.down) {
    player.setVelocityY(-130)
  }
  
}

function hitEnemy(target, bullets) {
  let rndX = Phaser.Math.Between(Math.round(target.x - ((target.width * target.scaleX ) * 0.3 )), Math.round(target.x + ((target.width * target.scaleX)  * 0.3)))
  let damageText = this.add.text(rndX, target.y - target.height * target.scaleY * 0.3, '😜')
  this.tweens.add({
    targets: damageText,
    y: -10,
    alpha: 0,
    ease: 'Linear',
    duration: 1500,
    onStart: function() {
      target.flipX = target.x > bullets.x  
      target.anims.play('damage_r')
    },
    onComplete: function() {
      target.setVelocityX(0)
      damageText.destroy()
    }
  })
  // this.tweens.add({
  //   targets: target,
  //   tint: 0xff9955,
  //   duration: 100,
  //   repeat: -1,
  //   // tint: 0xff9955,
  //   onStart: function() {
  //     target.setTint(0xff9955)
  //     //  target.frames.tint = 0xff9955
  //     // target.alpha 
  //   },
  //   onComplete: function() {
  //     // target.frames.clearTint()
  //   }
  // })
  
  bullets.destroy()
  
}